import urllib.request

urls = [
    "http://127.0.0.1:8000/",
    "http://127.0.0.1:5173/",
]

for url in urls:
    try:
        with urllib.request.urlopen(url, timeout=5) as response:
            print(url, response.status)
    except Exception as exc:
        print(url, "ERROR", exc)
