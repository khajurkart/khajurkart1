import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, MapPin, Plus } from 'lucide-react';

const Addresses = () => {
    const { user } = useAuth();
    const navigate = useNavigate();


    // Placeholder for addresses - in real app, fetch from backend
    const [editIndex, setEditIndex] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        name: '',
        phone: '',
        address: ''
    });

    // ✅ FETCH ADDRESSES
    const fetchAddresses = async () => {
        const res = await fetch("https://khajurkart1.onrender.com/api/user/address", {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        const data = await res.json();
        setAddresses(data);
    };

    useEffect(() => {
        if (!user) navigate('/');
    }, [user]);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleEdit = (addr, index) => {
        setNewAddress(addr);
        setEditIndex(index);
        setShowForm(true);
    };

    const handleSetDefault = async (index) => {
        await fetch(`https://khajurkart1.onrender.com/api/user/address/default/${index}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        fetchAddresses();
    };


    // ✅ ADD ADDRESS
    const handleAdd = async () => {
        const method = editIndex !== null ? "PUT" : "POST";
        const url =
            editIndex !== null
                ? `https://khajurkart1.onrender.com/api/user/address/${editIndex}`
                : "https://khajurkart1.onrender.com/api/user/address";

        await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(newAddress)
        });

        setShowForm(false);
        setNewAddress({ name: '', phone: '', address: '' });
        setEditIndex(null);
        fetchAddresses();
    };

    // ✅ DELETE ADDRESS
    const handleDelete = async (index) => {
        await fetch(`https://khajurkart1.onrender.com/api/user/address/${index}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        fetchAddresses();
    };

    return (
        <div className="min-h-screen bg-khajur-cream py-8" data-testid="addresses-page">
            <div className="max-w-4xl mx-auto px-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                        <Link
                            to="/account"
                            className="mr-4 text-khajur-primary hover:text-khajur-gold"
                            data-testid="back-to-account"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-4xl font-serif font-bold text-khajur-primary">My Addresses</h1>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-khajur-gold hover:bg-khajur-gold/90 hover:shadow-[0_0_15px_rgba(198,169,98,0.4)] text-khajur-primary px-6 py-3 rounded-sm transition-all uppercase tracking-wider font-bold text-sm flex items-center space-x-2"
                        data-testid="add-address-button"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add New</span>
                    </button>
                </div>

                {showForm && (
                    <div className="bg-white border p-6 mb-6">
                        <input
                            placeholder="Name"
                            value={newAddress.name}
                            onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                            className="border p-2 w-full mb-2"
                        />
                        <input
                            placeholder="Phone"
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                            className="border p-2 w-full mb-2"
                        />
                        <textarea
                            placeholder="Address"
                            value={newAddress.address}
                            onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                            className="border p-2 w-full mb-2"
                        />

                        <button onClick={handleAdd} className="bg-khajur-gold px-4 py-2 mr-2">
                            Save
                        </button>
                        <button onClick={() => setShowForm(false)} className="bg-gray-300 px-4 py-2">
                            Cancel
                        </button>
                    </div>
                )}

                {addresses.length === 0 ? (
                    <div className="bg-white border-2 border-khajur-primary/20 rounded-sm p-12 text-center">
                        <MapPin className="w-24 h-24 text-khajur-muted mx-auto mb-4" />
                        <h3 className="text-2xl font-serif font-medium text-khajur-primary mb-2">No addresses saved</h3>
                        <p className="text-khajur-dark/60 mb-6">Add your delivery addresses for faster checkout</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-khajur-gold hover:bg-khajur-gold/90 hover:shadow-[0_0_15px_rgba(198,169,98,0.4)] text-khajur-primary px-8 py-3 rounded-sm transition-all uppercase tracking-wider font-bold"
                            data-testid="add-first-address-button"
                        >
                            Add Your First Address
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {addresses.map((addr, index) => (
                            <div
                                key={index}
                                className="bg-white border-2 border-khajur-primary/20 rounded-sm p-5 flex flex-col justify-between hover:shadow-lg transition-all"
                            >
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-bold text-lg text-khajur-primary">{addr.name}</p>

                                        {/* DEFAULT BADGE */}
                                        {addr.isDefault && (
                                            <span className="text-xs bg-khajur-gold px-2 py-1 rounded">
                                                Default
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-khajur-dark/70">{addr.phone}</p>
                                    <p className="text-sm text-khajur-dark mt-1">{addr.address}</p>
                                </div>

                                {/* ACTION BUTTONS */}
                                <div className="flex justify-between mt-4">
                                    <button
                                        onClick={() => handleDelete(index)}
                                        className="text-red-500 text-sm hover:underline"
                                    >
                                        Delete
                                    </button>

                                    <div className="space-x-3">
                                        <button
                                            onClick={() => handleEdit(addr, index)}
                                            className="text-khajur-primary text-sm hover:underline"
                                        >
                                            Edit
                                        </button>

                                        {!addr.isDefault && (
                                            <button
                                                onClick={() => handleSetDefault(index)}
                                                className="text-khajur-gold text-sm hover:underline"
                                            >
                                                Set Default
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Addresses;
