"""
Auto-export OpenAPI → Postman Collection

Run from inside the backend directory:
    python -m scripts.export_postman

Reads the OpenAPI schema from the running (sandbox) app and converts it
into a Postman v2.1 collection, overwriting docs/postman/ZivonPay.postman_collection.json.

Requires: requests  (already in requirements.txt)
"""

import json
import sys
import os
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: 'requests' package required. pip install requests")
    sys.exit(1)

OPENAPI_URL = os.getenv("OPENAPI_URL", "http://localhost:8000/openapi.json")
OUTPUT = Path(__file__).resolve().parent.parent.parent / "docs" / "postman" / "ZivonPay.postman_collection.json"

METHOD_COLOURS = {
    "get": "GET",
    "post": "POST",
    "put": "PUT",
    "patch": "PATCH",
    "delete": "DELETE",
}


def openapi_to_postman(spec: dict) -> dict:
    """Convert an OpenAPI 3.x spec dict into a Postman v2.1 collection dict."""

    info = spec.get("info", {})
    collection: dict = {
        "info": {
            "name": info.get("title", "ZivonPay API"),
            "_postman_id": "zivonpay-auto-generated",
            "description": info.get("description", ""),
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        },
        "auth": {
            "type": "bearer",
            "bearer": [{"key": "token", "value": "{{access_token}}", "type": "string"}],
        },
        "variable": [{"key": "base_url", "value": "https://api.zivonpay.com"}],
        "item": [],
    }

    # Group by first tag
    folders: dict[str, list] = {}
    for path, methods in spec.get("paths", {}).items():
        for method, op in methods.items():
            if method not in METHOD_COLOURS:
                continue
            tags = op.get("tags", ["Other"])
            tag = tags[0]
            folders.setdefault(tag, [])

            # Build URL
            url_parts = [p for p in path.split("/") if p]
            raw_url = "{{base_url}}/" + "/".join(
                p if not p.startswith("{") else "{{" + p.strip("{}") + "}}" for p in url_parts
            )

            # Query params
            query = []
            for param in op.get("parameters", []):
                if param.get("in") == "query":
                    query.append({"key": param["name"], "value": "", "description": param.get("description", "")})

            item: dict = {
                "name": op.get("summary", f"{method.upper()} {path}"),
                "request": {
                    "method": method.upper(),
                    "header": [],
                    "url": {
                        "raw": raw_url + ("?" + "&".join(f"{q['key']}=" for q in query) if query else ""),
                        "host": ["{{base_url}}"],
                        "path": [
                            p if not p.startswith("{") else "{{" + p.strip("{}") + "}}" for p in url_parts
                        ],
                    },
                    "description": op.get("description", ""),
                },
                "event": [
                    {
                        "listen": "test",
                        "script": {
                            "type": "text/javascript",
                            "exec": [
                                "pm.test('Successful response', () => pm.response.to.be.success);"
                            ],
                        },
                    }
                ],
            }

            if query:
                item["request"]["url"]["query"] = query

            # Request body
            rb = op.get("requestBody", {})
            if rb:
                json_content = rb.get("content", {}).get("application/json", {})
                schema = json_content.get("schema", {})
                example = json_content.get("example") or schema.get("example") or {}
                if example:
                    item["request"]["body"] = {
                        "mode": "raw",
                        "raw": json.dumps(example, indent=4),
                        "options": {"raw": {"language": "json"}},
                    }

            folders[tag].append(item)

    for tag, items in folders.items():
        collection["item"].append({"name": tag, "item": items})

    return collection


def main():
    print(f"Fetching OpenAPI spec from {OPENAPI_URL} ...")
    try:
        resp = requests.get(OPENAPI_URL, timeout=10)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"ERROR: Could not fetch OpenAPI spec: {e}")
        print("Make sure the app is running in sandbox mode (APP_ENV=development).")
        sys.exit(1)

    spec = resp.json()
    print(f"  Title: {spec.get('info', {}).get('title')}")
    print(f"  Paths: {len(spec.get('paths', {}))}")

    collection = openapi_to_postman(spec)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(collection, f, indent=2)

    print(f"Postman collection written to {OUTPUT}")
    print(f"  Folders: {len(collection['item'])}")
    total_items = sum(len(folder["item"]) for folder in collection["item"])
    print(f"  Requests: {total_items}")


if __name__ == "__main__":
    main()
