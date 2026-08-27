import os

api_dir = r"c:\Users\dhara\Ai_Wildlife\backend\app\api\v1"
for filename in os.listdir(api_dir):
    if not filename.endswith(".py"):
        continue
    filepath = os.path.join(api_dir, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        if "recommendations" in content or "Recommendation" in content:
            print(f"Found in: {filename}")
            for i, line in enumerate(content.split("\n")):
                if "recommendations" in line or "resolve" in line or "router." in line:
                    print(f"  Line {i+1}: {line}")
