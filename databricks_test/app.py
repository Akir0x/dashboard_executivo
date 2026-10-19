import os
from flask import Flask, send_from_directory

app = Flask(__name__, static_folder="static")


@app.route("/")
def home():
    resp = send_from_directory("static", "dashexecutivo.html")
    resp.headers["Cache-Control"] = "no-cache"
    return resp


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("DATABRICKS_APP_PORT", 8000)))
