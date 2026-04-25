// RelatedProducts.jsx
import React from "react";
import { Link } from "react-router-dom";

const RelatedProducts = ({ products, currentProduct }) => {
    const related = products.filter(
        (p) =>
            p.category === currentProduct.category &&
            p.id !== currentProduct.id &&
            Math.abs(p.price - currentProduct.price) < 500
    ).slice(0, 8);

    return (
        <div className="mt-10">
            <h2 className="font-serif text-2xl text-khajur-primary mb-6">
                You may also like
            </h2>

            {/* ✅ GRID FIX */}
            <div className="flex gap-6 overflow-x-auto pb-4">
                {related.map((item) => (
                    <Link
                        to={`/product/${item.id}?category=${item.category}`}
                        key={item.id}
                    >
                        <div className="min-w-[200px] bg-white p-4 rounded shadow-sm hover:shadow-md transition">

                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-40 object-cover rounded mb-3"
                            />

                            <h4 className="text-khajur-primary font-medium text-sm">
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
