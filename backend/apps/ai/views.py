"""
FarmConnect — AI Feature Views

All AI endpoints live here:
  1. /api/v1/ai/generate-description/  — Auto product description
  2. /api/v1/ai/price-suggest/          — Price suggestion for farmers
  3. /api/v1/ai/chat/                   — Chatbot for buyers & farmers
  4. /api/v1/ai/insights/               — Farmer sales insights

All use Google Gemini 1.5 Flash — free tier.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from django.utils import timezone
from datetime import timedelta

from .gemini import call_gemini, call_gemini_chat
from apps.accounts.models import User


# ══════════════════════════════════════════════════════════════════════════════
# 1. AUTO PRODUCT DESCRIPTION GENERATOR
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_description(request):
    """
    POST /api/v1/ai/generate-description/

    Farmer provides basic product details and AI writes a
    compelling, honest description for the listing.

    Body: { name, category, quantity, unit, location }
    Returns: { description }
    """
    if request.user.role != User.ROLE_FARMER:
        return Response({'error': 'Farmers only.'}, status=403)

    name     = request.data.get('name', '').strip()
    category = request.data.get('category', '').strip()
    quantity = request.data.get('quantity', '')
    unit     = request.data.get('unit', '')
    location = request.data.get('location', '').strip()

    if not name:
        return Response({'error': 'Product name is required.'}, status=400)

    # Build the farmer's location context
    farm_location = location
    if not farm_location and hasattr(request.user, 'farmerprofile'):
        farm_location = request.user.farmerprofile.location or 'Uganda'

    farm_name = ''
    if hasattr(request.user, 'farmerprofile'):
        farm_name = request.user.farmerprofile.farm_name or ''

    prompt = f"""Write a short, honest and appealing product description for a farmer
selling fresh produce on an online marketplace in Uganda.

Product details:
- Product name: {name}
- Category: {category}
- Available quantity: {quantity} {unit}
- Farm location: {farm_location}
- Farm name: {farm_name or 'local farm'}

Requirements:
- Write exactly 2 to 3 sentences
- Mention freshness, quality, or how it was grown if relevant
- Be honest — do not exaggerate or make false claims
- Write in a friendly, direct tone as if the farmer is speaking
- Do NOT include price information
- Do NOT start with "Introducing" or "Discover"
- Keep it simple and natural

Write only the description. No title, no label, no extra text."""

    try:
        description = call_gemini(prompt, max_tokens=200)
        return Response({'description': description})
    except Exception as e:
        return Response(
            {'error': f'AI service error: {str(e)}'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )


# ══════════════════════════════════════════════════════════════════════════════
# 2. PRICE SUGGESTION ENGINE
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def price_suggestion(request):
    """
    POST /api/v1/ai/price-suggest/

    Farmer provides product details and gets an AI-suggested
    price range based on current market data from the platform.

    Body: { name, category, unit, quantity }
    Returns: { min_price, recommended_price, max_price, reasoning }
    """
    if request.user.role != User.ROLE_FARMER:
        return Response({'error': 'Farmers only.'}, status=403)

    name     = request.data.get('name', '').strip()
    category = request.data.get('category', '').strip()
    unit     = request.data.get('unit', 'kg')
    quantity = request.data.get('quantity', '')

    if not name:
        return Response({'error': 'Product name is required.'}, status=400)

    # Get similar products already on the platform for context
    from apps.products.models import Product
    similar = Product.objects.filter(
        name__icontains=name.split()[0],  # match first word
        is_available=True
    ).exclude(
        farmer=request.user
    ).values_list('price', flat=True)[:10]

    market_prices = [float(p) for p in similar]
    price_context = ""
    if market_prices:
        avg_price = sum(market_prices) / len(market_prices)
        price_context = f"""
Similar products currently listed on our platform (prices per {unit}):
- Prices found: {[f'UGX {int(p):,}' for p in market_prices]}
- Average market price: UGX {int(avg_price):,} per {unit}"""
    else:
        price_context = f"No similar products currently listed on the platform."

    # Get farmer's location for regional context
    location = ''
    if hasattr(request.user, 'farmerprofile'):
        location = request.user.farmerprofile.location or 'Uganda'

    prompt = f"""You are a market pricing advisor for smallholder farmers in Uganda.
A farmer needs help pricing their product competitively.

Product details:
- Product: {name}
- Category: {category}
- Unit: per {unit}
- Quantity available: {quantity} {unit}
- Farmer location: {location}

Market context:
{price_context}

Ugandan market context:
- Prices are in Ugandan Shillings (UGX)
- Typical fresh produce prices range from UGX 500 to UGX 15,000 per kg
- Farmers should price competitively but not undersell their effort

Respond with ONLY valid JSON in this exact format:
{{
  "min_price": 2000,
  "recommended_price": 3500,
  "max_price": 5000,
  "reasoning": "One sentence explaining why this price range makes sense."
}}

Use realistic UGX values. No markdown, no extra text."""

    try:
        result = call_gemini(prompt, expect_json=True, max_tokens=300)

        # Ensure we have the expected fields
        if isinstance(result, dict) and 'recommended_price' in result:
            return Response(result)
        else:
            return Response({
                'error': 'Could not generate a price suggestion. Please try again.'
            }, status=400)

    except Exception as e:
        return Response(
            {'error': f'AI service error: {str(e)}'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )


# ══════════════════════════════════════════════════════════════════════════════
# 3. AI CHATBOT
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat(request):
    """
    POST /api/v1/ai/chat/

    Context-aware AI chatbot for both farmers and buyers.
    Knows the user's role, name, and adapts responses accordingly.

    Body: { message, history: [{ role, content }] }
    Returns: { reply }
    """
    message = request.data.get('message', '').strip()
    history = request.data.get('history', [])

    if not message:
        return Response({'error': 'Message is required.'}, status=400)

    user = request.user

    # Build a context-aware system prompt based on user role
    if user.role == User.ROLE_FARMER:
        profile     = getattr(user, 'farmerprofile', None)
        farm_name   = profile.farm_name if profile else 'your farm'
        location    = profile.location  if profile else 'Uganda'

        # Get a quick summary of their products for context
        from apps.products.models import Product
        product_names = list(
            Product.objects.filter(farmer=user, is_available=True)
            .values_list('name', flat=True)[:5]
        )
        products_str = ', '.join(product_names) if product_names else 'no products listed yet'

        system = f"""You are FarmConnect Assistant, a helpful AI built into the
FarmConnect marketplace platform in Uganda.

You are talking to a FARMER named {user.first_name} {user.last_name}.
Their farm is called "{farm_name}" located in {location}.
Their current listed products: {products_str}.

Your job is to help this farmer with:
- Writing or improving product descriptions
- Pricing their produce competitively
- Understanding their sales and orders
- Managing their listings effectively
- General farming tips relevant to Uganda
- Using the FarmConnect platform

Rules:
- Keep responses SHORT and practical (3-5 sentences max unless explaining something complex)
- Be friendly and encouraging
- Use UGX for all prices
- If asked about platform features, explain them clearly
- Do not make up data you do not have"""

    elif user.role == User.ROLE_BUYER:
        profile = getattr(user, 'buyerprofile', None)

        system = f"""You are FarmConnect Assistant, a helpful AI built into the
FarmConnect marketplace platform in Uganda.

You are talking to a BUYER named {user.first_name} {user.last_name}.

Your job is to help this buyer with:
- Finding the right fresh produce on the platform
- Understanding what products are in season in Uganda
- Explaining how ordering and delivery works
- Tracking and understanding their orders
- Getting the best value when buying
- Any questions about the platform

Rules:
- Keep responses SHORT and friendly (3-5 sentences max)
- Use UGX for all prices
- Be helpful and encouraging
- Seasonal guide: Uganda has two rainy seasons (Mar-May, Oct-Dec)
  which affect produce availability
- Do not make up specific product availability — tell them to browse the catalog"""

    else:
        system = "You are FarmConnect Assistant. Be helpful and concise."

    # Build conversation history for Gemini
    # Gemini uses 'user' and 'model' roles (not 'assistant')
    gemini_history = []
    for msg in history[-10:]:  # keep last 10 messages for context
        role = 'model' if msg.get('role') in ['assistant', 'model'] else 'user'
        gemini_history.append({'role': role, 'content': msg['content']})

    # Add the current message
    gemini_history.append({'role': 'user', 'content': message})

    try:
        reply = call_gemini_chat(gemini_history, system_instruction=system)
        return Response({'reply': reply})
    except Exception as e:
        return Response(
            {'error': f'AI service error: {str(e)}'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )


# ══════════════════════════════════════════════════════════════════════════════
# 4. FARMER AI INSIGHTS
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def farmer_insights(request):
    """
    GET /api/v1/ai/insights/

    Returns an AI-generated plain-English summary of the
    farmer's sales performance for the past 30 days.

    AI analyses real order data and writes actionable advice.
    """
    if request.user.role != User.ROLE_FARMER:
        return Response({'error': 'Farmers only.'}, status=403)

    from apps.orders.models import Order, OrderItem
    from apps.products.models import Product
    from django.db.models import Sum, Count

    farmer   = request.user
    last_30  = timezone.now() - timedelta(days=30)

    # Gather real sales data
    orders = Order.objects.filter(
        farmer=farmer,
        created_at__gte=last_30
    )

    total_orders   = orders.count()
    total_revenue  = float(
        orders.exclude(status='cancelled')
              .aggregate(total=Sum('total_amount'))['total'] or 0
    )
    pending_count  = orders.filter(status='pending').count()
    delivered_count= orders.filter(status='delivered').count()
    cancelled_count= orders.filter(status='cancelled').count()

    # Top selling products
    top_products = (
        OrderItem.objects
        .filter(order__farmer=farmer, order__created_at__gte=last_30)
        .exclude(order__status='cancelled')
        .values('product_name')
        .annotate(total_qty=Sum('quantity'), total_revenue=Sum('subtotal'))
        .order_by('-total_qty')[:5]
    )
    top_list = [
        f"{p['product_name']} ({int(p['total_qty'])} units, "
        f"UGX {int(p['total_revenue']):,})"
        for p in top_products
    ]

    # Products with low/zero stock
    low_stock = Product.objects.filter(
        farmer=farmer, quantity__lte=5, is_available=True
    ).values_list('name', 'quantity')[:5]
    low_stock_list = [f"{n} ({q} remaining)" for n, q in low_stock]

    # Total active listings
    total_products = Product.objects.filter(
        farmer=farmer, is_available=True
    ).count()

    # Build the prompt with real data
    prompt = f"""You are a friendly and encouraging business advisor for smallholder
farmers in Uganda. Write a performance summary for this farmer.

FARMER: {farmer.first_name} {farmer.last_name}
FARM: {getattr(farmer.farmerprofile, 'farm_name', 'their farm') if hasattr(farmer, 'farmerprofile') else 'their farm'}
PERIOD: Last 30 days

SALES DATA:
- Total orders received: {total_orders}
- Total revenue earned: UGX {int(total_revenue):,}
- Orders delivered successfully: {delivered_count}
- Orders still pending: {pending_count}
- Orders cancelled: {cancelled_count}
- Active product listings: {total_products}
- Top selling products: {', '.join(top_list) if top_list else 'None yet'}
- Products running low on stock: {', '.join(low_stock_list) if low_stock_list else 'None'}

Write a performance summary with EXACTLY these 3 paragraphs:

Paragraph 1 (Performance Overview):
Summarise how the farmer performed this month. Mention revenue and order numbers
in a positive, encouraging way even if numbers are low.

Paragraph 2 (What Is Working):
Highlight what is going well. Mention top products if any.
If no sales yet, encourage them to add more products and improve listings.

Paragraph 3 (One Actionable Tip):
Give ONE specific, practical suggestion they can act on immediately.
Base it on the data — e.g. restock a low product, lower price of slow item,
add photos to listings, etc.

Keep each paragraph to 2-3 sentences. Write directly to the farmer using "you"."""

    try:
        insights_text = call_gemini(prompt, max_tokens=500)
        return Response({
            'insights': insights_text,
            'data': {
                'total_orders':    total_orders,
                'total_revenue':   total_revenue,
                'delivered':       delivered_count,
                'pending':         pending_count,
                'cancelled':       cancelled_count,
                'total_products':  total_products,
                'top_products':    top_list,
                'low_stock':       low_stock_list,
            },
            'generated_at': timezone.now().isoformat(),
        })
    except Exception as e:
        return Response(
            {'error': f'AI service error: {str(e)}'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
