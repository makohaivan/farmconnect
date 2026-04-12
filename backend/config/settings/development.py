"""
FarmConnect - Development Settings
Extends base settings with dev-specific overrides
"""
from .base import *

DEBUG = True

# Show all SQL queries in the console during development
# Useful for spotting N+1 query problems early
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level':    'DEBUG',  # Change to WARNING to hide SQL queries
        },
    },
}
