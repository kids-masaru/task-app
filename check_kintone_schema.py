import requests
import json
import os

# Configuration (using values from kintone_notion_app/.env)
BASE_URL = "https://n2amf.cybozu.com"
APP_ID = "52"
API_TOKEN = "MKIsBor99WYeG1uAEkV3ADZllkRKHRg6zAojyF8X"

def fetch_schema():
    url = f"{BASE_URL}/k/v1/app/form/fields.json"
    headers = {"X-Cybozu-API-Token": API_TOKEN}
    params = {"app": APP_ID}
    
    print(f"Fetching schema for App {APP_ID}...")
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Check "対応者" field
        field_info = data['properties'].get('対応者')
        print(f"\n[Field: 対応者]")
        print(json.dumps(field_info, indent=2, ensure_ascii=False))
        
        # Check "新規営業件名" field
        field_subject = data['properties'].get('新規営業件名')
        print(f"\n[Field: 新規営業件名]")
        print(json.dumps(field_subject, indent=2, ensure_ascii=False))

    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response:
             print(e.response.text)

if __name__ == "__main__":
    fetch_schema()
