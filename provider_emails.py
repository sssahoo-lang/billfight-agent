PROVIDER_EMAILS = {
    # Internet/Cable
    "comcast": "customer_support@comcast.com",
    "xfinity": "customer_support@comcast.com",
    "at&t": "attretention@att.com",
    "att": "attretention@att.com",
    "verizon": "verizon@verizon.com",
    "spectrum": "spectrum@charter.com",
    "cox": "cox@cox.com",
    "optimum": "support@optimum.net",
    "suddenlink": "support@suddenlink.com",
    "frontier": "frontier@frontier.com",
    "centurylink": "support@centurylink.com",
    "lumen": "support@lumen.com",
    "earthlink": "support@earthlink.net",
    "mediacom": "support@mediacomcc.com",
    "wow": "support@wowway.com",

    # Phone/Mobile
    "t-mobile": "support@t-mobile.com",
    "tmobile": "support@t-mobile.com",
    "sprint": "support@sprint.com",
    "boost": "support@boostmobile.com",
    "cricket": "support@cricketwireless.com",
    "metro": "support@metrobyt-mobile.com",
    "mint": "support@mintmobile.com",
    "visible": "support@visible.com",

    # Insurance
    "geico": "geico@geico.com",
    "state farm": "statefarm@statefarm.com",
    "allstate": "allstate@allstate.com",
    "progressive": "progressive@progressive.com",
    "liberty mutual": "libertymutual@libertymutual.com",
    "nationwide": "nationwide@nationwide.com",
    "farmers": "farmers@farmers.com",
    "usaa": "usaa@usaa.com",
    "aetna": "aetna@aetna.com",
    "cigna": "cigna@cigna.com",
    "humana": "humana@humana.com",
    "anthem": "anthem@anthem.com",
    "bcbs": "bcbs@bcbs.com",

    # Streaming
    "netflix": "support@netflix.com",
    "hulu": "support@hulu.com",
    "disney": "support@disneyplus.com",
    "hbo": "support@hbomax.com",
    "paramount": "support@paramountplus.com",
    "peacock": "support@peacocktv.com",
    "apple": "support@apple.com",
    "spotify": "support@spotify.com",
    "amazon": "support@amazon.com",

    # Utilities
    "pg&e": "support@pge.com",
    "con ed": "support@coned.com",
    "duke energy": "support@duke-energy.com",
    "dominion": "support@dominionenergy.com",
    "southern company": "support@southerncompany.com",
    "national grid": "support@nationalgrid.com",
    "american water": "support@amwater.com",
}


def get_provider_email(provider_name: str) -> dict:
    """Look up provider email, return match info."""
    provider_lower = provider_name.lower().strip()
    
    # Direct match
    if provider_lower in PROVIDER_EMAILS:
        return {
            "found": True,
            "email": PROVIDER_EMAILS[provider_lower],
            "confidence": "high",
            "provider": provider_name
        }
    
    # Partial match
    for key, email in PROVIDER_EMAILS.items():
        if key in provider_lower or provider_lower in key:
            return {
                "found": True,
                "email": email,
                "confidence": "medium",
                "provider": key
            }
    
    # Not found
    return {
        "found": False,
        "email": None,
        "confidence": "none",
        "provider": provider_name,
        "message": "Please enter the company's customer service email manually"
    }


def get_all_providers() -> list:
    """Return list of all known providers."""
    return list(set(PROVIDER_EMAILS.keys()))
