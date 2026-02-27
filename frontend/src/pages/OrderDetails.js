import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ChevronLeft } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OrderDetails = () => {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line
  }, [id]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API}/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrder(response.data);
    } catch (err) {
      console.error("Failed to fetch order", err);
      setError("Order not found or unauthorized");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="mb-4 text-red-500">{error}</p>
        <Link to="/my-orders" className="text-blue-600 underline">
          Back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-5xl mx-auto px-6">

        {/* Back Button */}
        <Link
          to="/my-orders"
          className="inline-flex items-center mb-6 text-blue-600 hover:underline"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Orders
        </Link>

        <h1 className="text-3xl font-bold mb-6">Order Details</h1>

        {/* Order Info */}
        <div className="bg-white shadow-md rounded p-6 mb-6">
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Total Amount:</strong> ₹{order.totalAmount}</p>
          <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
          <p><strong>Created At:</strong> {new Date(order.createdAt).toLocaleString()}</p>
        </div>

        {/* Ordered Items */}
        <div className="bg-white shadow-md rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Items</h2>

          {order.items && order.items.length > 0 ? (
            order.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between border-b py-3"
              >
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-gray-500">
                    Quantity: {item.quantity}
                  </p>
                </div>

                <div>
                  ₹{item.price}
                </div>
              </div>
            ))
          ) : (
            <p>No items found in this order.</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default OrderDetails;
