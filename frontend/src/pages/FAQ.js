import React from "react";

const faqs = [
  {
    question: "Are your dates premium quality?",
    answer: "Yes, we provide premium quality dates sourced carefully for freshness and taste."
  },
  {
    question: "Do you offer free shipping?",
    answer: "Yes, free shipping is available on selected orders based on cart value."
  },
  {
    question: "Do you provide gift packaging?",
    answer: "Yes, we offer premium gift packaging for festivals, weddings, and corporate gifting."
  },
  {
    question: "How many days does delivery take?",
    answer: "Usually delivery takes 3–7 business days depending on your location."
  },
  {
    question: "Is Cash on Delivery available?",
    answer: "Yes, COD is available for selected locations."
  },
  {
    question: "Are your dry fruits vacuum packed?",
    answer: "Yes, our products are packed carefully to maintain freshness and quality."
  }
];

const FAQ = () => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">

      <h1 className="text-4xl font-bold text-center text-khajur-primary mb-12">
        Frequently Asked Questions
      </h1>

      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white shadow-md rounded-xl p-6 border"
          >
            <h2 className="text-lg font-semibold text-khajur-primary">
              {faq.question}
            </h2>

            <p className="text-gray-600 mt-2">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
};

export default FAQ;
