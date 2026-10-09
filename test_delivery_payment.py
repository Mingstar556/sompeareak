import unittest
import json
from server import app
import database

class TestDeliveryPayment(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_phnom_penh_cod_order(self):
        """Test that placing a COD order in Phnom Penh retains COD on order and receipt"""
        payload = {
            'user_id': 'Utest_buyer',
            'items': [{'name': 'Custom Charm Bracelet', 'price': 10.0, 'qty': 1, 'pt': 5}],
            'subtotal': 10.0,
            'discount': 0.0,
            'delivery': 1.5,
            'total': 11.5,
            'earned': 5,
            'payment': 'Cash on Delivery (COD)',
            'payment_type': 'COD',
            'contact': {
                'name': 'Dara Sok',
                'phone': '012999888',
                'address': 'House 12, St 271, Phnom Penh',
                'province': 'Phnom Penh',
                'payment': 'Cash on Delivery (COD)',
                'payment_type': 'COD'
            }
        }
        res = self.client.post('/api/orders', json=payload)
        self.assertEqual(res.status_code, 200)
        order = res.get_json()
        self.assertIsNotNone(order)
        self.assertEqual(order['payment'], 'Cash on Delivery (COD)')
        self.assertEqual(order['payment_type'], 'COD')
        self.assertEqual(order['contact']['payment'], 'Cash on Delivery (COD)')
        self.assertEqual(order['contact']['payment_type'], 'COD')

        # Retrieve order by ID (used for receipt)
        res_get = self.client.get(f"/api/orders/{order['id']}")
        self.assertEqual(res_get.status_code, 200)
        retrieved = res_get.get_json()
        self.assertEqual(retrieved['payment'], 'Cash on Delivery (COD)')
        self.assertEqual(retrieved['payment_type'], 'COD')
        self.assertIn('COD', retrieved['payment'])
        self.assertNotIn('KHQR', retrieved['payment'])

    def test_province_khqr_order(self):
        """Test that placing an order in a Province retains ABA KHQR on order and receipt"""
        payload = {
            'user_id': 'Utest_buyer',
            'items': [{'name': 'Luxury Plush Velvet Bear', 'price': 15.0, 'qty': 1, 'pt': 2}],
            'subtotal': 15.0,
            'discount': 0.0,
            'delivery': 1.5,
            'total': 16.5,
            'earned': 2,
            'payment': 'ABA KHQR (Scan to Pay)',
            'payment_type': 'KHQR',
            'contact': {
                'name': 'Bopha Pich',
                'phone': '098765432',
                'address': 'St 6, Siem Reap',
                'province': 'Siem Reap',
                'payment': 'ABA KHQR (Scan to Pay)',
                'payment_type': 'KHQR'
            }
        }
        res = self.client.post('/api/orders', json=payload)
        self.assertEqual(res.status_code, 200)
        order = res.get_json()
        self.assertEqual(order['payment'], 'ABA KHQR (Scan to Pay)')
        self.assertEqual(order['payment_type'], 'KHQR')

        # Retrieve order
        res_get = self.client.get(f"/api/orders/{order['id']}")
        self.assertEqual(res_get.status_code, 200)
        retrieved = res_get.get_json()
        self.assertEqual(retrieved['payment'], 'ABA KHQR (Scan to Pay)')
        self.assertEqual(retrieved['payment_type'], 'KHQR')

    def test_universal_checkout_payment_capture(self):
        """Test that universal_checkout also captures payment method properly"""
        payload = {
            'name': 'Kosal Chan',
            'phone': '011223344',
            'address': 'St 110, Wat Phnom, Phnom Penh',
            'items': [{'name': 'Minifigure Cute Bear', 'price': 5.0, 'qty': 1}],
            'total': 6.5,
            'payment': 'Cash on Delivery (COD)'
        }
        res = self.client.post('/api/checkout', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['ok'])
        order = data['order']
        self.assertEqual(order['payment'], 'Cash on Delivery (COD)')
        self.assertEqual(order['payment_type'], 'COD')

if __name__ == '__main__':
    unittest.main()
