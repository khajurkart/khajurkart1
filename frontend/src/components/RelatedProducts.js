// RelatedProducts.jsx
import React from "react";

const RelatedProducts = ({ products, currentProduct }) => {
  const related = products.filter(
    (p) =>
      p.category === currentProduct.category &&
      p.id !== currentProduct.id
  ).slice(0, 4); // show max 4

  return (
    <div style={{ marginTop: "40px" }}>
      <h2>You may also like</h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "20px"
      }}>
        {related.map((item) => (
          <div key={item.id} style={{ border: "1px solid #eee", padding: "10px" }}>
            <img src={item.image} alt={item.name} style={{ width: "100%" }} />
            <h4>{item.name}</h4>
            <p>₹{item.price}</p>
            <button>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
