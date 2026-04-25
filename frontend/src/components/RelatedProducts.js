// RelatedProducts.jsx
import React from "react";
import { Link } from "react-router-dom";

const RelatedProducts = ({ products, currentProduct }) => {
    const related = products.filter(
        (p) =>
            p.category === currentProduct.category &&
            p.id !== currentProduct.id
    ).slice(0, 4); // show max 4

    return (
        <div style={{ marginTop: "40px" }}>
            <h2 className="font-serif text-2xl text-khajur-primary mb-6">
                You may also like
            </h2>

            {related.map((item) => (
                <Link
                    to={`/product/${item.id}?category=${item.category}`}
                    key={item.id}
                >
                    <div className="bg-white p-4 rounded shadow-sm w-[200px]">
                        <div className="bg-white p-4 rounded shadow-sm">
                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-40 object-cover rounded"
                            />

                            <h4 className="text-khajur-primary font-medium">
                                {item.name}
                            </h4>

                            <p className="text-khajur-gold font-bold">
                                ₹{item.price}
                            </p>

                            <button className="text-sm text-khajur-primary hover:text-khajur-gold">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default RelatedProducts;
