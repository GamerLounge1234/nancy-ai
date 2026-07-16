import requests
import json
import os
import re
from bs4 import BeautifulSoup

def scrape_dbd_patch_notes():
    # We hit the API endpoint instead of the web page. 
    # This completely bypasses the Cloudflare HTML Javascript challenge.
    api_url = "https://deadbydaylight.fandom.com/api.php"
    
    # We use a custom User-Agent to identify our bot politely, which the API prefers
    headers = {
        "User-Agent": "NancyAI/1.0 (Data Ingestion Bot; +https://github.com/yourusername)"
    }
    
    # First, we ask the API for the main Patch Notes hub page
    params = {
        "action": "parse",
        "page": "Patch_Notes",
        "format": "json"
    }
    
    print("Connecting to the Fandom API...")
    response = requests.get(api_url, headers=headers, params=params)
    
    if response.status_code != 200:
        print(f"API blocked the request. Status: {response.status_code}")
        return
        
    data = response.json()
    
    if "error" in data:
        print(f"API Error: {data['error']['info']}")
        return

    print("Success! Parsing raw database text...")
    
    # The API returns raw HTML string inside the JSON. We use BeautifulSoup just to strip the tags.
    raw_html = data['parse']['text']['*']
    soup = BeautifulSoup(raw_html, 'html.parser')
    
    # Extract all text, keeping it clean
    paragraphs = soup.find_all(['p', 'li', 'h2', 'h3'])
    clean_text = [p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 20]
    
    # Save the data locally
    os.makedirs('data', exist_ok=True)
    with open('data/patch_notes.json', 'w', encoding='utf-8') as f:
        json.dump(clean_text, f, indent=4)
        
    print(f"Bypassed Cloudflare. Saved {len(clean_text)} text blocks to data/patch_notes.json")

if __name__ == "__main__":
    scrape_dbd_patch_notes()