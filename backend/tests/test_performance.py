import unittest
import time
from fastapi.testclient import TestClient
from app.main import app
from app.api.orthologue import search_orthologues

class TestOrthologuePerformance(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.max_response_time = 50  # 50ms maximum response time

    def test_search_orthologues_performance(self):
        """Test that orthologue search response time is under 50ms"""
        test_gene_id = "Aco000536.1"  # Example gene ID
        
        # Measure response time
        start_time = time.time()
        response = self.client.post("/api/orthologue/search", json={"gene_id": test_gene_id})
        end_time = time.time()
        
        # Calculate response time in milliseconds
        response_time = (end_time - start_time) * 1000
        
        # Assert response time is under 50ms
        self.assertLess(response_time, self.max_response_time, 
                       f"Response time {response_time:.2f}ms exceeds maximum allowed {self.max_response_time}ms")
        
        # Also verify the response is successful
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])

    def test_get_orthologue_tree_performance(self):
        """Test that getting orthologue tree response time is under 50ms"""
        # Measure response time
        start_time = time.time()
        response = self.client.get("/api/orthologue/tree")
        end_time = time.time()
        
        # Calculate response time in milliseconds
        response_time = (end_time - start_time) * 1000
        
        # Assert response time is under 50ms
        self.assertLess(response_time, self.max_response_time,
                       f"Response time {response_time:.2f}ms exceeds maximum allowed {self.max_response_time}ms")
        
        # Also verify the response is successful
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])

if __name__ == '__main__':
    unittest.main() 