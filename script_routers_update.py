import os
import re

router_dir = "/Users/zen/personal/proyects/proyectoSolarApp/solar-erp/backend/app/routers"
skip_files = ["__init__.py", "auth.py", "agent.py", "dashboard.py"]

models = [
    "Client", "Installation", "Activity", "Photo", "PendingTask", 
    "Budget", "Payment", "Maintenance", "Product", "StockMovement", 
    "Problem", "Solution", "User"
]

for fname in os.listdir(router_dir):
    if not fname.endswith(".py") or fname in skip_files:
        continue
    
    path = os.path.join(router_dir, fname)
    with open(path, "r") as f:
        content = f.read()
    
    # 1. Inject company_id on model_dump()
    content = re.sub(
        r"(\*\*[a-zA-Z_]+\.model_dump\([^)]*\))",
        r"company_id=current_user["company_id"], \1",
        content
    )
    
    # 2. Add .where(Model.company_id == current_user["company_id"]) to select, update, delete
    for M in models:
        # replace `select(Model)` with `select(Model).where(Model.company_id == current_user["company_id"])`
        # Make sure we don't duplicate
        pattern_select = r"select\(" + M + r"\)(?![\s]*\.where\(" + M + r"\.company_id)"
        content = re.sub(
            pattern_select,
            r"select(" + M + r").where(" + M + r".company_id == current_user["company_id"])",
            content
        )
        
        pattern_update = r"update\(" + M + r"\)(?![\s]*\.where\(" + M + r"\.company_id)"
        content = re.sub(
            pattern_update,
            r"update(" + M + r").where(" + M + r".company_id == current_user["company_id"])",
            content
        )
        
        pattern_delete = r"delete\(" + M + r"\)(?![\s]*\.where\(" + M + r"\.company_id)"
        content = re.sub(
            pattern_delete,
            r"delete(" + M + r").where(" + M + r".company_id == current_user["company_id"])",
            content
        )

    with open(path, "w") as f:
        f.write(content)

print("Updated routers!")
