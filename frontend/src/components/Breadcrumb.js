import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const Breadcrumb = ({ items }) => {
    return (
        <nav
            aria-label="Breadcrumb"
            className="max-w-7xl mx-auto px-6 md:px-12 py-4"
        >
            <ol
                className="flex items-center flex-wrap gap-1 text-sm"
                itemScope
                itemType="https://schema.org/BreadcrumbList"
            >
                {items.map((item, index) => (
                    <li
                        key={index}
                        className="flex items-center gap-1"
                        itemProp="itemListElement"
                        itemScope
                        itemType="https://schema.org/ListItem"
                    >
                        {index < items.length - 1 ? (
                            <>
                                <Link
                                    to={item.to}
                                    className="text-khajur-dark/50 hover:text-khajur-gold transition-colors"
                                    itemProp="item"
                                >
                                    <span itemProp="name">{item.label}</span>
                                </Link>
                                <ChevronRight className="w-3 h-3 text-khajur-dark/30" />
                            </>
                        ) : (
                            <span
                                className="text-khajur-primary font-medium truncate max-w-[200px]"
                                itemProp="name"
                                aria-current="page"
                            >
                                {item.label}
                            </span>
                        )}
                        <meta itemProp="position" content={String(index + 1)} />
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumb;
