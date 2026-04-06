import React, { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchReviews();
  }, []);

const fetchReviews = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.get(`${API}/admin/reviews`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setReviews(res.data);
  } catch (err) {
    console.error("ERROR:", err.response?.data || err.message);
  }
};

  const deleteReview = async (id) => {
    try {
      await axios.delete(`${API}/admin/reviews/${id}`);
      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
  try {
    const token = localStorage.getItem("token");

    await axios.delete(`${API}/admin/reviews/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // remove from UI
    setReviews(reviews.filter(r => r.id !== id));

  } catch (err) {
    console.error("Delete error:", err.response?.data || err.message);
  }
};

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">Customer Reviews</h1>

      {reviews.map((r) => (
        <div key={r.id} className="border p-4 mb-4 rounded">
          <p><strong>Product ID:</strong> {r.product_id}</p>
          <p><strong>User:</strong> {r.user_name}</p>
          <p><strong>Comment:</strong> {r.comment}</p>

          <button
            onClick={() => handleDelete(review.id)}
            className="bg-red-500 text-white px-4 py-2"
           >
             Delete
          </button>
        </div>
      ))}
    </div>
  );
};

export default AdminReviews;
