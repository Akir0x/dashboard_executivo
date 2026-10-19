import os
import re
import json
import traceback
import time
import datetime as dt
from zoneinfo import ZoneInfo

from flask import Flask, Response, jsonify, request, send_from_directory
from werkzeug.exceptions import HTTPException
from databricks import sql
from databricks.sdk.core import Config

BASE = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=os.path.join(BASE, "static"))
cfg = Config()

HTML = open(os.path.join(BASE, "static", "dashexecutivo.html"), encoding="utf-8").read()
FONTS_CSS = "".join(re.findall(r"@font-face\{[^}]*\}", HTML))
SCHEMA = os.environ.get("TABELAS", "catalogo.schema")  # catalogo.schema
EDITORES = {e.strip().lower() for e in os.environ.get("EDITORES", "").split(",") if e.strip()}
CACHE_SEG = int(os.environ.get("CACHE_SEG", "300"))
_cache = {"t": 0, "html": ""}

# Tabelas editáveis e a coluna-chave de cada uma (None = linha única).
CHAVES = {"tbIniciativas": "ID", "tbFrentes": "ID", "tbPainel": None}
AUTOMATICAS = {"AlteradoPor", "AlteradoEm"}  # preenchidas pelo app


# ---------- acesso ao SQL warehouse ----------
def executar(consulta, params=None, retorna=True):
    with sql.connect(
        server_hostname=cfg.host,
        http_path=f"/sql/1.0/warehouses/{os.environ['DATABRICKS_WAREHOUSE_ID']}",
        credentials_provider=lambda: cfg.authenticate,
    ) as conn, conn.cursor() as cur:
        cur.execute(consulta, params or {})
        if not retorna:
            return [], []
        cols = [d[0] for d in cur.description]
        return cols, cur.fetchall()


def nome_completo(tab):
    if tab not in CHAVES:
        raise KeyError(tab)
    return f"{SCHEMA}.{tab}"


def colunas_editaveis(tab):
    """Lê as colunas da própria tabela (assim colunas Rec_* novas aparecem sozinhas)."""
    _, rows = executar(f"DESCRIBE TABLE {nome_completo(tab)}")
    cols = []
    for r in rows:
        nome, tipo = r[0], (r[1] or "").lower()
        if not nome or nome.startswith("#") or nome in AUTOMATICAS:
            continue
        cols.append((nome, "DATE" if tipo == "date" else "STRING"))
    return cols


def valor_json(o):
    return o.isoformat() if hasattr(o, "isoformat") else str(o)


def js(obj):
    return json.dumps(obj, default=valor_json, ensure_ascii=False).replace("</", "<\\/")


def ler(tab):
    cols, rows = executar(f"SELECT * FROM {nome_completo(tab)}")
    return [dict(zip(cols, r)) for r in rows]


# ---------- painel (somente leitura) ----------
@app.route("/")
def home():
    if time.time() - _cache["t"] > CACHE_SEG:
        agora = dt.datetime.now(ZoneInfo("America/Sao_Paulo")).strftime("%d/%m/%Y %H:%M")
        _cache["html"] = (
            HTML.replace("/*PAINEL*/[]", js(ler("tbPainel")))
            .replace("/*FRENTES*/[]", js(ler("tbFrentes")))
            .replace("/*DADOS*/[]", js(ler("tbIniciativas")))
            .replace("/*GERADO_EM*/", agora)
        )
        _cache["t"] = time.time()
    html = _cache["html"]
    if pode_editar():  # o botão "Editar" só aparece para quem está em EDITORES
        html = html.replace("</head>", '<script>window.EDITAR_URL="/editar";</script></head>', 1)
    resp = Response(html, mimetype="text/html")
    resp.headers["Cache-Control"] = "private, no-store"  # a página varia conforme o usuário
    return resp


# ---------- edição (só para quem está em EDITORES) ----------
def usuario():
    return (request.headers.get("X-Forwarded-Email") or "").strip().lower()


def pode_editar():
    return bool(usuario()) and usuario() in EDITORES


def negado():
    msg = "Sem permissão para editar."
    if not EDITORES:
        msg = "Defina a variável EDITORES no app.yaml (e-mails separados por vírgula)."
    return jsonify(erro=msg), 403


@app.route("/fonts.css")
def fontes():
    # Reaproveita as fontes (Barlow) que já estão embutidas no HTML do painel.
    resp = Response(FONTS_CSS, mimetype="text/css")
    resp.headers["Cache-Control"] = "public, max-age=86400"
    return resp


@app.route("/editar")
def editar():
    if not pode_editar():
        return Response(negado()[0].get_json()["erro"], status=403, mimetype="text/plain")
    return send_from_directory(app.static_folder, "editar.html")


@app.route("/api/<tab>", methods=["GET"])
def api_ler(tab):
    if tab not in CHAVES:
        return jsonify(erro="Tabela inválida."), 404
    if not pode_editar():
        return negado()
    cols = colunas_editaveis(tab)
    linhas = ler(tab)
    chave = CHAVES[tab]
    if chave:
        linhas.sort(key=lambda r: str(r.get(chave) or ""))
    return Response(
        json.dumps(
            {
                "colunas": [{"nome": n, "tipo": t} for n, t in cols],
                "chave": chave,
                "linhas": linhas,
                "usuario": usuario(),
            },
            default=valor_json,
            ensure_ascii=False,
        ),
        mimetype="application/json",
    )


@app.route("/api/<tab>", methods=["POST"])
def api_salvar(tab):
    if tab not in CHAVES:
        return jsonify(erro="Tabela inválida."), 404
    if not pode_editar():
        return negado()
    linha = (request.get_json(silent=True) or {}).get("linha") or {}
    chave = CHAVES[tab]
    cols = colunas_editaveis(tab)
    if chave and not str(linha.get(chave) or "").strip():
        return jsonify(erro=f"Preencha a coluna {chave}."), 400

    params = {}
    for nome, _ in cols:
        v = linha.get(nome)
        v = v.strip() if isinstance(v, str) else v
        params[nome] = v if v not in ("", None) else None
    params["alterado_por"] = usuario()

    sel = ", ".join(f"CAST(:{n} AS {t}) AS `{n}`" for n, t in cols)
    sel += ", :alterado_por AS `AlteradoPor`, current_timestamp() AS `AlteradoEm`"
    cond = f"t.`{chave}` = s.`{chave}`" if chave else "TRUE"
    executar(
        f"MERGE INTO {nome_completo(tab)} AS t USING (SELECT {sel}) AS s ON {cond} "
        "WHEN MATCHED THEN UPDATE SET * WHEN NOT MATCHED THEN INSERT *",
        params,
        retorna=False,
    )
    _cache["t"] = 0  # o painel passa a refletir a alteração
    return jsonify(ok=True)


@app.route("/api/<tab>/excluir", methods=["POST"])
def api_excluir(tab):
    chave = CHAVES.get(tab)
    if not chave:
        return jsonify(erro="Esta tabela não permite excluir linhas."), 400
    if not pode_editar():
        return negado()
    valor = str((request.get_json(silent=True) or {}).get("chave") or "").strip()
    if not valor:
        return jsonify(erro="Linha sem chave."), 400
    executar(
        f"DELETE FROM {nome_completo(tab)} WHERE `{chave}` = :v", {"v": valor}, retorna=False
    )
    _cache["t"] = 0
    return jsonify(ok=True)


@app.errorhandler(Exception)
def erro_geral(e):
    """Registra o erro no log do app e mostra o motivo só para quem é editor."""
    if isinstance(e, HTTPException):
        return e
    traceback.print_exc()
    detalhe = f"{type(e).__name__}: {e}"
    if request.path.startswith("/api/"):
        return jsonify(erro=detalhe if pode_editar() else "Erro interno."), 500
    if pode_editar():
        return Response(
            "Erro ao montar a página. Copie esta mensagem:\n\n" + detalhe,
            status=500,
            mimetype="text/plain",
        )
    return Response("Erro interno. Avise o responsável pelo painel.", status=500, mimetype="text/plain")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("DATABRICKS_APP_PORT", 8000)))
