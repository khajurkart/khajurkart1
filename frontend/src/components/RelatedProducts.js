import React from "react";
import { Link } from "react-router-dom";

const RelatedProducts = ({ products, currentProduct, type }) => {

    let filteredProducts = [];

    if (type === "related") {
        // SAME CATEGORY
        filteredProducts = products.filter(
            (p) =>
                p.category === currentProduct.category &&
                p.id !== currentProduct.id &&
                Math.abs(p.price - currentProduct.price) < 500
        );
    } else if (type === "explore") {
        // DIFFERENT CATEGORY
        filteredProducts = products.filter(
            (p) =>
                p.category !== currentProduct.category
        );
    }

    const items = filteredProducts.slice(0, 8);

    return (
        <div className="mt-10">
            <h2 className="font-serif text-2xl text-khajur-primary mb-6">
                {type === "related" ? "You May Also Like" : "Explore More"}
            </h2>

            {/* HORIZONTAL SCROLL */}
            <div className="flex gap-6 overflow-x-auto pb-4">
                {items.map((item) => (
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
