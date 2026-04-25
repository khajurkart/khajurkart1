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
        <div className="mt-10">
            <h2 className="font-serif text-2xl text-khajur-primary mb-6">
                You may also like
            </h2>

            {/* ✅ GRID FIX */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {related.map((item) => (
                    <Link
                        to={`/product/${item.id}?category=${item.category}`}
                        key={item.id}
                    >
                        <div className="bg-white p-4 rounded shadow-sm hover:shadow-md transition">

                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-48 object-cover rounded mb-3"
                            />

                            <h4 className="text-khajur-primary font-medium">
                                {item.name}
                            </h4>

                            <p className="text-khajur-gold font-bold">
                                ₹{item.price}
                            </p>

                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default RelatedProducts;
