import datetime
import os
import re
from pathlib import Path

MARKER = "agentic-sdlc:published-links"
DOCS_PATH = "/docs"
OPENAPI_PATH = "/openapi.json"
ENTITY_LABEL = "Maintenance"
COLLECTION = "maintenances"
WORKFLOW = "deploy-azure.yml"

api = f"https://{os.environ['API_APP']}.azurewebsites.net"
ui = f"https://{os.environ['UI_APP']}.azurewebsites.net"
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
block = '\n'.join([
    f'<!-- {MARKER}:start -->',
    '| Component | URL |',
    '| --- | --- |',
    f'| UI | <{ui}> |',
    f'| API | <{api}> |',
    f'| Swagger UI | <{api}{DOCS_PATH}> |',
    f'| OpenAPI document | <{api}{OPENAPI_PATH}> |',
    f'| {ENTITY_LABEL} API | <{api}/api/{COLLECTION}> |',
    f'| API health probe | <{api}/health> |',
    '',
    f'_Published and verified {stamp} by the Agentic SDLC DevOps & Release Agent via `{WORKFLOW}`. '
    'Smoke tests covered the health probe, Swagger/OpenAPI, the UI, and a create/update/delete round trip._',
    f'<!-- {MARKER}:end -->',
])
path = Path('README.md')
readme = path.read_text(encoding='utf-8')
pattern = rf'<!-- {re.escape(MARKER)}:start -->.*?<!-- {re.escape(MARKER)}:end -->'
updated, count = re.subn(pattern, block, readme, flags=re.DOTALL)
if count != 1:
    raise RuntimeError('Published-links marker is missing or duplicated')
if updated != readme:
    path.write_text(updated, encoding='utf-8')
