import pytest
from httpx import AsyncClient
from backend.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_user_registration_validation():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Invalid short password
        response = await ac.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "123",
            "full_name": "Test User"
        })
    assert response.status_code in [400, 422]

@pytest.mark.asyncio
async def test_application_validation():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Missing required fields without auth
        response = await ac.post("/api/applications", json={
            "company_name": "Acme Inc"
        })
    assert response.status_code in [401, 403, 422]
