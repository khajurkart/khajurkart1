import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, MapPin, Plus, Trash2 } from 'lucide-react';

const Addresses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    address: ''
  });

  // ✅ FETCH ADDRESSES
  const fetchAddresses = async () => {
    const res = await fetch("https://khajurkart.com/api/user/address", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
    const data = await res.json();
    setAddresses(data);
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // ✅ ADD ADDRESS
  const handleAdd = async () => {
    await fetch("https://khajurkart.com/api/user/address", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(newAddress)
    });

    setShowForm(false);
    setNewAddress({ name: '', phone: '', address: '' });
    fetchAddresses();
  };

  // ✅ DELETE ADDRESS
  const handleDelete = async (index) => {
    await fetch(`https://khajurkart.com/api/user/address/${index}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });

    fetchAddresses();
  };

  return (
    <div className="min-h-screen bg-khajur-cream py-8">
      <div className="max-w-4xl mx-auto px-6">

        {/* HEADER */}
        <div className="flex justify-between mb-8">
          <div className="flex items-center">
            <Link to="/account">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl ml-4">My Addresses</h1>
          </div>

          <button onClick={() => setShowForm(true)} className="bg-yellow-500 px-4 py-2 flex items-center">
            <Plus className="w-5 h-5 mr-1" /> Add
          </button>
        </div>

        {/* ADD FORM */}
        {showForm && (
          <div className="bg-white p-4 mb-6 border">
            <input
              placeholder="Name"
              value={newAddress.name}
              onChange={(e) => setNewAddress({...newAddress, name: e.target.value})}
              className="border p-2 w-full mb-2"
            />
            <input
              placeholder="Phone"
              value={newAddress.phone}
              onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
              className="border p-2 w-full mb-2"
            />
            <textarea
              placeholder="Address"
              value={newAddress.address}
              onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
              className="border p-2 w-full mb-2"
            />

            <button onClick={handleAdd} className="bg-green-500 text-white px-4 py-2 mr-2">
              Save
            </button>
            <button onClick={() => setShowForm(false)} className="bg-gray-400 px-4 py-2">
              Cancel
            </button>
          </div>
        )}

        {/* EMPTY */}
        {addresses.length === 0 ? (
          <div className="text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4" />
            <p>No addresses</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {addresses.map((addr, index) => (
              <div key={index} className="bg-white p-4 border flex justify-between">
                <div>
                  <p><strong>{addr.name}</strong></p>
                  <p>{addr.phone}</p>
                  <p>{addr.address}</p>
                </div>

                <button onClick={() => handleDelete(index)}>
                  <Trash2 className="text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Addresses;
