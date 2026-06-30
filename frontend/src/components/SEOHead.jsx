// frontend/src/components/SEOHead.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHead = ({
    title,
    description,
    canonical,
    image = 'https://res.cloudinary.com/dwpqa8pgl/image/upload/v1777381692/Logo-Photoroom_nslk5u.png',
    type = 'website',
    noIndex = false,
}) => {
    const fullTitle = title
        ? `${title} — KhajurKart`
        : 'KhajurKart — Premium Dates, Dry Fruits & Spices';

    const fullCanonical = canonical
        ? `https://khajurkart.com${canonical}`
        : 'https://khajurkart.com';

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description"        content={description}         />
            <link rel="canonical"           href={fullCanonical}          />
            {noIndex && <meta name="robots" content="noindex, nofollow"  />}
            <meta property="og:title"       content={fullTitle}           />
            <meta property="og:description" content={description}         />
            <meta property="og:image"       content={image}               />
            <meta property="og:type"        content={type}                />
            <meta property="og:url"         content={fullCanonical}       />
            <meta property="og:site_name"   content="KhajurKart"          />
            <meta property="og:locale"      content="en_IN"               />
            <meta name="twitter:card"        content="summary_large_image"/>
            <meta name="twitter:title"       content={fullTitle}           />
            <meta name="twitter:description" content={description}         />
            <meta name="twitter:image"       content={image}               />
            <meta name="theme-color"         content="#1a3a2a"             />
            <meta name="author"              content="KhajurKart"          />
        </Helmet>
    );
};

export default SEOHead;
