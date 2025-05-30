import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc, getDocs, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
    FaFileInvoiceDollar,
    FaChartLine,
    FaBell,
    FaEdit,
    FaPlus,
    FaSearch,
    FaTrash,
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt,
    FaBuilding,
    FaChartBar,
    FaUserCircle,
    FaUsers
} from 'react-icons/fa';

import "./css/Dashbill.css";
import logo from './assets/logo.png';
import { Link } from "react-router-dom";


import { MdDashboard } from "react-icons/md";

const Dashbill = () => {
    // États pour les clients
    const [client, setClient] = useState({
        nom: "",
        adresse: "",
        email: "",
        telephone: "",
        societe: ""
    });

    const [clients, setClients] = useState([]);
    const [factures, setFactures] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [editingClient, setEditingClient] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("dashboard");
    const navigate = useNavigate();

    // États pour les équipes
    const [equipe, setEquipe] = useState({
        nom: "",
        description: "",
        responsable: ""
    });
    const [equipes, setEquipes] = useState([]);
    const [editingEquipe, setEditingEquipe] = useState(null);
    const [isEditingEquipe, setIsEditingEquipe] = useState(false);

    // Statistiques
    const [stats, setStats] = useState({
        totalClients: 0,
        totalFactures: 42,
        revenusMensuels: 12500,
        facturesImpayees: 3,
        totalEquipes: 0
    });

    // Charger les clients depuis Firebase
    useEffect(() => {
        const q = query(collection(db, "clients"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clientsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setClients(clientsData);
            setStats(prev => ({ ...prev, totalClients: clientsData.length }));
        });
        return () => unsubscribe();
    }, []);

    // Charger les équipes (simulé pour l'exemple)
    useEffect(() => {
        // En production, vous chargeriez cela depuis Firebase
        const equipesSimulees = [
            { id: "1", nom: "Équipe Commerciale", description: "Ventes et marketing", responsable: "Jean Dupont" },
            { id: "2", nom: "Équipe Technique", description: "Développement produit", responsable: "Marie Martin" },
            { id: "3", nom: "Équipe Support", description: "Support client", responsable: "Pierre Lambert" }
        ];
        setEquipes(equipesSimulees);
        setStats(prev => ({ ...prev, totalEquipes: equipesSimulees.length }));
    }, []);

    const loadFactures = async (clientId) => {
        try {
            const q = query(collection(db, "factures"), where("clientId", "==", clientId));
            const querySnapshot = await getDocs(q);

            const facturesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setFactures(facturesData);
            setSelectedClient(clients.find(c => c.id === clientId));
            setIsEditing(false);
        } catch (error) {
            console.error("Erreur lors du chargement des factures:", error);
            alert("Erreur lors du chargement des factures");
        }
    };
    // Charger toutes les factures depuis Firebase
    useEffect(() => {
        if (activeTab === "factures" || activeTab === "dashboard") {
            const q = query(collection(db, "factures"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const facturesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setFactures(facturesData);

                // Mettez à jour les statistiques
                setStats(prev => ({
                    ...prev,
                    totalFactures: facturesData.length,
                    facturesImpayees: facturesData.filter(f => f.statut === "en attente").length,
                    revenusMensuels: facturesData
                        .filter(f => new Date(f.date).getMonth() === new Date().getMonth())
                        .reduce((sum, f) => sum + parseFloat(f.totalTTC || 0), 0)
                }));
            });
            return () => unsubscribe();
        }
    }, [activeTab]);

    const handleDeleteFacture = async (factureId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
            try {
                await deleteDoc(doc(db, "factures", factureId));
                alert("Facture supprimée avec succès !");
                setFactures(factures.filter(f => f.id !== factureId));
            } catch (error) {
                console.error("Erreur:", error);
                alert("Erreur lors de la suppression de la facture.");
            }
        }
    };

    // Gestion des clients
    const handleChange = (e) => {
        setClient({ ...client, [e.target.name]: e.target.value });
    };

    const handleEditChange = (e) => {
        setEditingClient({ ...editingClient, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "clients"), client);
            alert("Client ajouté avec succès !");
            setClient({ nom: "", adresse: "", email: "", telephone: "", societe: "" });
        } catch (error) {
            console.error("Erreur:", error);
            alert("Erreur lors de l'ajout du client.");
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateDoc(doc(db, "clients", editingClient.id), editingClient);
            alert("Client modifié avec succès !");
            setEditingClient(null);
            setIsEditing(false);
        } catch (error) {
            console.error("Erreur:", error);
            alert("Erreur lors de la modification du client.");
        }
    };

    const handleDelete = async (clientId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
            try {
                await deleteDoc(doc(db, "clients", clientId));
                alert("Client supprimé avec succès !");
                if (selectedClient && selectedClient.id === clientId) {
                    setSelectedClient(null);
                    setFactures([]);
                }
            } catch (error) {
                console.error("Erreur:", error);
                alert("Erreur lors de la suppression du client.");
            }
        }
    };

    const handleEdit = (client) => {
        setEditingClient({ ...client });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Gestion des équipes
    const handleEquipeChange = (e) => {
        setEquipe({ ...equipe, [e.target.name]: e.target.value });
    };

    const handleEquipeEditChange = (e) => {
        setEditingEquipe({ ...editingEquipe, [e.target.name]: e.target.value });
    };

    const handleEquipeSubmit = async (e) => {
        e.preventDefault();
        try {
            // En production, vous utiliseriez addDoc pour Firebase
            const newEquipe = { ...equipe, id: Date.now().toString() };
            setEquipes([...equipes, newEquipe]);
            setStats(prev => ({ ...prev, totalEquipes: prev.totalEquipes + 1 }));
            alert("Équipe ajoutée avec succès !");
            setEquipe({ nom: "", description: "", responsable: "" });
        } catch (error) {
            console.error("Erreur:", error);
            alert("Erreur lors de l'ajout de l'équipe.");
        }
    };

    const handleEquipeUpdate = async (e) => {
        e.preventDefault();
        try {
            // En production, vous utiliseriez updateDoc pour Firebase
            setEquipes(equipes.map(eq =>
                eq.id === editingEquipe.id ? editingEquipe : eq
            ));
            alert("Équipe modifiée avec succès !");
            setEditingEquipe(null);
            setIsEditingEquipe(false);
        } catch (error) {
            console.error("Erreur:", error);
            alert("Erreur lors de la modification de l'équipe.");
        }
    };

    const handleEquipeDelete = (equipeId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette équipe ?")) {
            try {
                // En production, vous utiliseriez deleteDoc pour Firebase
                setEquipes(equipes.filter(eq => eq.id !== equipeId));
                setStats(prev => ({ ...prev, totalEquipes: prev.totalEquipes - 1 }));
                alert("Équipe supprimée avec succès !");
            } catch (error) {
                console.error("Erreur:", error);
                alert("Erreur lors de la suppression de l'équipe.");
            }
        }
    };

    const handleEquipeEdit = (equipe) => {
        setEditingEquipe({ ...equipe });
        setIsEditingEquipe(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCreateInvoice = () => {
        if (!selectedClient) {
            alert("Veuillez sélectionner un client d'abord");
            return;
        }
        navigate("/bill", { state: { client: selectedClient } });
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditingClient(null);
    };

    const cancelEquipeEdit = () => {
        setIsEditingEquipe(false);
        setEditingEquipe(null);
    };

    const filteredClients = clients.filter(client =>
        client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.societe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredEquipes = equipes.filter(equipe =>
        equipe.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipe.responsable?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getLastThreeInvoices = () => {
        return [...factures]
            .sort((a, b) => new Date(b.date) - new Date(a.date)) // Trie par date décroissante
            .slice(0, 3); // Prend les 3 premières
    };
    // Rendu du contenu en fonction de l'onglet actif
    const renderActiveTab = () => {
        switch (activeTab) {
            case "dashboard":
                return (
                    <>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon clients">
                                    <FaUsers />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.totalClients}</h3>
                                    <p>Clients</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon invoices">
                                    <FaFileInvoiceDollar />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.totalFactures}</h3>
                                    <p>Factures</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon revenue">
                                    <FaChartLine />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.revenusMensuels.toLocaleString()} FCFA</h3>
                                    <p>Facturations mensuels</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon pending">
                                    <FaBell />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.facturesImpayees}</h3>
                                    <p>Impayées</p>
                                </div>
                            </div>
                        </div>

                        <div className="recent-invoices">
                            <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                <h2 className="section-title" style={{ display: "flex", alignItems: "center", margin: 0 }}>
                                    <FaFileInvoiceDollar style={{ marginRight: "10px" }} />
                                    Dernières factures
                                </h2>

                                <div className="invoices-actions" style={{ display: "flex", gap: "10px" }}>
                                    <button onClick={() => navigate("/bill")} className="create-invoice-btn">
                                        <FaPlus style={{ marginRight: "8px" }} />
                                        Créer une facture
                                    </button>
                                </div>
                            </div>


                            {factures.length > 0 ? (
                                <div className="invoices-list">
                                    {getLastThreeInvoices().map(invoice => (
                                        <div key={invoice.id} className="invoice-card">
                                            <div className="invoice-header">
                                                <span className="invoice-number">{invoice.numero}</span>
                                                <span className={`invoice-status ${invoice.statut}`}>
                                                    {invoice.statut}
                                                </span>
                                            </div>
                                            <div className="invoice-client">{invoice.clientNom}</div>
                                            <div className="invoice-details">
                                                <span className="invoice-amount">{invoice.totalTTC} FCFA</span>
                                                <span className="invoice-date">
                                                    {new Date(invoice.date).toLocaleDateString('fr-FR')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <p>Aucune facture trouvée</p>
                                </div>
                            )}
                        </div>
                    </>
                );
            case "clients":
                return (
                    <>
                        {isEditing ? (
                            <form onSubmit={handleUpdate} className="client-form">
                                <h2 className="form-title">
                                    <FaEdit style={{ marginRight: "10px" }} />
                                    Modifier le client
                                </h2>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="edit-nom" className="form-label">Nom <span className="required">*</span></label>
                                        <input
                                            id="edit-nom"
                                            name="nom"
                                            value={editingClient.nom}
                                            onChange={handleEditChange}
                                            required
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="edit-societe" className="form-label">Société</label>
                                        <input
                                            id="edit-societe"
                                            name="societe"
                                            value={editingClient.societe}
                                            onChange={handleEditChange}
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="edit-email" className="form-label">Email</label>
                                        <input
                                            id="edit-email"
                                            name="email"
                                            type="email"
                                            value={editingClient.email}
                                            onChange={handleEditChange}
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="edit-telephone" className="form-label">Téléphone</label>
                                        <input
                                            id="edit-telephone"
                                            name="telephone"
                                            value={editingClient.telephone}
                                            onChange={handleEditChange}
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="edit-adresse" className="form-label">Adresse</label>
                                    <input
                                        id="edit-adresse"
                                        name="adresse"
                                        value={editingClient.adresse}
                                        onChange={handleEditChange}
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-actions">
                                    <button type="button" onClick={cancelEdit} className="cancel-btn">
                                        Annuler
                                    </button>
                                    <button type="submit" className="update-btn">
                                        Mettre à jour
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleSubmit} className="client-form">
                                <h2 className="form-title">
                                    <FaPlus style={{ marginRight: "10px" }} />
                                    Ajouter un nouveau client
                                </h2>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="nom" className="form-label">Nom <span className="required">*</span></label>
                                        <input
                                            id="nom"
                                            name="nom"
                                            value={client.nom}
                                            onChange={handleChange}
                                            required
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="societe" className="form-label">Société</label>
                                        <input
                                            id="societe"
                                            name="societe"
                                            value={client.societe}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="email" className="form-label">Email</label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={client.email}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="telephone" className="form-label">Téléphone</label>
                                        <input
                                            id="telephone"
                                            name="telephone"
                                            value={client.telephone}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="adresse" className="form-label">Adresse</label>
                                    <input
                                        id="adresse"
                                        name="adresse"
                                        value={client.adresse}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                </div>

                                <button type="submit" className="submit-btn">
                                    Ajouter le client
                                </button>
                            </form>
                        )}

                        <div className="clients-section">
                            <div className="section-header">
                                <h2 className="section-title">
                                    <FaUsers style={{ marginRight: "10px" }} />
                                    Clients ({filteredClients.length})
                                </h2>
                                <div className="search-box">
                                    <FaSearch className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un client..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {filteredClients.length === 0 ? (
                                <div className="empty-state">
                                    <img src="/empty-state.svg" alt="Aucun client" />
                                    <p>Aucun client trouvé</p>
                                    <button className="primary-btn">
                                        <FaPlus /> Ajouter un client
                                    </button>
                                </div>
                            ) : (
                                <div className="clients-grid">
                                    {filteredClients.map((c) => (
                                        <div
                                            key={c.id}
                                            className={`client-card ${selectedClient?.id === c.id ? 'active' : ''}`}
                                            onClick={() => loadFactures(c.id)}
                                        >
                                            <div className="client-header">
                                                <div className="client-avatar">
                                                    {c.nom.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="client-info">
                                                    <div className="client-name">{c.nom}</div>
                                                    {c.societe && <div className="client-company">{c.societe}</div>}
                                                </div>
                                                <div className="client-actions">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(c);
                                                        }}
                                                        className="action-btn edit-btn"
                                                        title="Modifier"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(c.id);
                                                        }}
                                                        className="action-btn delete-btn"
                                                        title="Supprimer"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="client-details">
                                                {c.email && (
                                                    <div className="client-detail">
                                                        <FaEnvelope className="detail-icon" />
                                                        <span className="detail-value">{c.email}</span>
                                                    </div>
                                                )}
                                                {c.telephone && (
                                                    <div className="client-detail">
                                                        <FaPhone className="detail-icon" />
                                                        <span className="detail-value">{c.telephone}</span>
                                                    </div>
                                                )}
                                                {c.adresse && (
                                                    <div className="client-detail">
                                                        <FaMapMarkerAlt className="detail-icon" />
                                                        <span className="detail-value">{c.adresse}</span>
                                                    </div>
                                                )}
                                                {c.societe && (
                                                    <div className="client-detail">
                                                        <FaBuilding className="detail-icon" />
                                                        <span className="detail-value">{c.societe}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedClient && (
                            <div className="invoices-section">
                                <div className="invoices-header">
                                    <h2 className="section-title">
                                        <FaFileInvoiceDollar style={{ marginRight: "10px" }} />
                                        Factures de {selectedClient.nom} ({factures.length})
                                    </h2>
                                    <div className="invoices-actions">
                                        <button
                                            onClick={handleCreateInvoice}
                                            className="create-invoice-btn"
                                        >
                                            <FaPlus style={{ marginRight: "8px" }} />
                                            Créer une facture
                                        </button>
                                        <button className="export-btn">
                                            Exporter
                                        </button>
                                    </div>
                                </div>

                                {factures.length === 0 ? (
                                    <div className="empty-state">
                                        <img src="/empty-invoices.svg" alt="Aucune facture" />
                                        <p>Aucune facture trouvée pour ce client</p>
                                        <button
                                            onClick={handleCreateInvoice}
                                            className="primary-btn"
                                        >
                                            <FaPlus /> Créer une facture
                                        </button>
                                    </div>
                                ) : (
                                    <div className="invoices-table-container">
                                        <table className="invoice-table">
                                            <thead>
                                                <tr>
                                                    <th>Numéro</th>
                                                    <th>Date</th>
                                                    <th>Montant</th>
                                                    <th>Statut</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {factures.map(f => (
                                                    <tr key={f.id}>
                                                        <td>{f.numero}</td>
                                                        <td>{f.date}</td>
                                                        <td>{f.prixTotal} FCFA</td>
                                                        <td>
                                                            <span className={`invoice-status ${f.statut}`}>
                                                                {f.statut}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="table-actions">
                                                                <button className="action-btn edit-btn" title="Modifier">
                                                                    <FaEdit />
                                                                </button>
                                                                <button className="action-btn delete-btn" title="Supprimer">
                                                                    <FaTrash />
                                                                </button>
                                                                <button className="action-btn view-btn" title="Voir">
                                                                    <FaSearch />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                );
            case "equipes":
                return (
                    <>
                        {isEditingEquipe ? (
                            <form onSubmit={handleEquipeUpdate} className="client-form">
                                <h2 className="form-title">
                                    <FaEdit style={{ marginRight: "10px" }} />
                                    Modifier l'équipe
                                </h2>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="edit-equipe-nom" className="form-label">Nom <span className="required">*</span></label>
                                        <input
                                            id="edit-equipe-nom"
                                            name="nom"
                                            value={editingEquipe.nom}
                                            onChange={handleEquipeEditChange}
                                            required
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="edit-equipe-responsable" className="form-label">Responsable</label>
                                        <input
                                            id="edit-equipe-responsable"
                                            name="responsable"
                                            value={editingEquipe.responsable}
                                            onChange={handleEquipeEditChange}
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="edit-equipe-description" className="form-label">Description</label>
                                    <textarea
                                        id="edit-equipe-description"
                                        name="description"
                                        value={editingEquipe.description}
                                        onChange={handleEquipeEditChange}
                                        className="form-input"
                                        rows="3"
                                    />
                                </div>

                                <div className="form-actions">
                                    <button type="button" onClick={cancelEquipeEdit} className="cancel-btn">
                                        Annuler
                                    </button>
                                    <button type="submit" className="update-btn">
                                        Mettre à jour
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleEquipeSubmit} className="client-form">
                                <h2 className="form-title">
                                    <FaPlus style={{ marginRight: "10px" }} />
                                    Ajouter une nouvelle équipe
                                </h2>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="equipe-nom" className="form-label">Nom <span className="required">*</span></label>
                                        <input
                                            id="equipe-nom"
                                            name="nom"
                                            value={equipe.nom}
                                            onChange={handleEquipeChange}
                                            required
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="equipe-responsable" className="form-label">Responsable</label>
                                        <input
                                            id="equipe-responsable"
                                            name="responsable"
                                            value={equipe.responsable}
                                            onChange={handleEquipeChange}
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="equipe-description" className="form-label">Description</label>
                                    <textarea
                                        id="equipe-description"
                                        name="description"
                                        value={equipe.description}
                                        onChange={handleEquipeChange}
                                        className="form-input"
                                        rows="3"
                                    />
                                </div>

                                <button type="submit" className="submit-btn">
                                    Ajouter l'équipe
                                </button>
                            </form>
                        )}

                        <div className="clients-section">
                            <div className="section-header">
                                <h2 className="section-title">
                                    <FaUsers style={{ marginRight: "10px" }} />
                                    Équipes ({filteredEquipes.length})
                                </h2>
                                <div className="search-box">
                                    <FaSearch className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher une équipe..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {filteredEquipes.length === 0 ? (
                                <div className="empty-state">
                                    <img src="/empty-state.svg" alt="Aucune équipe" />
                                    <p>Aucune équipe trouvée</p>
                                    <button className="primary-btn" onClick={() => setIsEditingEquipe(false)}>
                                        <FaPlus /> Ajouter une équipe
                                    </button>
                                </div>
                            ) : (
                                <div className="clients-grid">
                                    {filteredEquipes.map((eq) => (
                                        <div key={eq.id} className="client-card">
                                            <div className="client-header">
                                                <div className="client-avatar">
                                                    <FaUsers />
                                                </div>
                                                <div className="client-info">
                                                    <div className="client-name">{eq.nom}</div>
                                                    {eq.responsable && <div className="client-company">Responsable: {eq.responsable}</div>}
                                                </div>
                                                <div className="client-actions">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEquipeEdit(eq);
                                                        }}
                                                        className="action-btn edit-btn"
                                                        title="Modifier"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEquipeDelete(eq.id);
                                                        }}
                                                        className="action-btn delete-btn"
                                                        title="Supprimer"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="client-details">
                                                {eq.description && (
                                                    <div className="client-detail">
                                                        <span className="detail-label">Description:</span>
                                                        <span className="detail-value">{eq.description}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                );

            case "factures":
                return (
                    <>
                        <div className="clients-section">
                            <div className="section-header">
                                <h2 className="section-title">
                                    <FaFileInvoiceDollar style={{ marginRight: "10px" }} />
                                    Factures ({factures.length})
                                </h2>
                                <div className="search-box">
                                    <FaSearch className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher une facture..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="invoices-actions">
                                    <button
                                        onClick={() => navigate("/bill")}
                                        className="create-invoice-btn"
                                    >
                                        <FaPlus style={{ marginRight: "8px" }} />
                                        Créer une facture
                                    </button>
                                </div>
                            </div>

                            {factures.length === 0 ? (
                                <div className="empty-state">
                                    <img src="/empty-invoices.svg" alt="Aucune facture" />
                                    <p>Aucune facture trouvée</p>
                                    <button
                                        onClick={() => navigate("/bill")}
                                        className="primary-btn"
                                    >
                                        <FaPlus /> Créer une facture
                                    </button>
                                </div>
                            ) : (
                                <div className="clients-grid">
                                    {factures.map((f) => (
                                        <div key={f.id} className="client-card">
                                            <div className="client-header">
                                                <div className="client-avatar">
                                                    <FaFileInvoiceDollar />
                                                </div>
                                                <div className="client-info">
                                                    <div className="client-name">{f.numero}</div>
                                                    <div className="client-company">{f.clientNom || "Sans client"}</div>
                                                </div>
                                                <div className="client-actions">
                                                    <button
                                                        className="action-btn edit-btn"
                                                        title="Modifier"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate("/bill", {
                                                                state: {
                                                                    facture: f,
                                                                    client: selectedClient
                                                                }
                                                            });
                                                        }}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        className="action-btn delete-btn"
                                                        title="Supprimer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteFacture(f.id);
                                                        }}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="client-details">
                                                <div className="client-detail">
                                                    <span className="detail-label">Client:</span>
                                                    <span className="detail-value">{f.clientNom || "N/A"}</span>
                                                </div>
                                                <div className="client-detail">
                                                    <span className="detail-label">Date:</span>
                                                    <span className="detail-value">{f.date}</span>
                                                </div>
                                                <div className="client-detail">
                                                    <span className="detail-label">Montant:</span>
                                                    <span className="detail-value">{f.totalTTC} FCFA</span>
                                                </div>
                                                {/*  <div className="client-detail">
                                        <span className="detail-label">Statut:</span>
                                      <span className={`invoice-status ${f.statut}`}>
                                            {f.statut}
                                        </span> 
                                    </div> */}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                );
            case "stats":
                return (
                    <div className="stats-section">
                        <h2 className="section-title">
                            <FaChartBar style={{ marginRight: "10px" }} />
                            Statistiques
                        </h2>

                        <div className="stats-grid">
                            <div className="stat-card large">
                                <div className="stat-icon clients">
                                    <FaUsers />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.totalClients}</h3>
                                    <p>Clients enregistrés</p>
                                    <div className="stat-trend up">
                                        +5% ce mois-ci
                                    </div>
                                </div>
                            </div>

                            <div className="stat-card large">
                                <div className="stat-icon invoices">
                                    <FaFileInvoiceDollar />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.totalFactures}</h3>
                                    <p>Factures émises</p>
                                    <div className="stat-trend up">
                                        +12% ce mois-ci
                                    </div>
                                </div>
                            </div>

                            <div className="stat-card large">
                                <div className="stat-icon revenue">
                                    <FaChartLine />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.revenusMensuels.toLocaleString()} €</h3>
                                    <p>Revenus mensuels</p>
                                    <div className="stat-trend down">
                                        -3% ce mois-ci
                                    </div>
                                </div>
                            </div>

                            <div className="stat-card large">
                                <div className="stat-icon pending">
                                    <FaBell />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.facturesImpayees}</h3>
                                    <p>Factures impayées</p>
                                    <div className="stat-trend up">
                                        +2 ce mois-ci
                                    </div>
                                </div>
                            </div>

                            <div className="stat-card large">
                                <div className="stat-icon teams">
                                    <FaUsers />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.totalEquipes}</h3>
                                    <p>Équipes actives</p>
                                    <div className="stat-trend neutral">
                                        Stable
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="charts-container">
                            <div className="chart-card">
                                <h3>Factures par mois</h3>
                                <div className="chart-placeholder">
                                    [Graphique des factures par mois]
                                </div>
                            </div>

                            <div className="chart-card">
                                <h3>Répartition des clients</h3>
                                <div className="chart-placeholder">
                                    [Graphique de répartition des clients]
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return <div>Sélectionnez une section</div>;
        }
    };

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <Link
                    to="/"
                    onClick={() => setActiveTab("dashboard")}
                    className="sidebar-header"
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}
                >
                    <img src={logo} alt="Logo Ment@Bill" style={{ height: '50px' }} />
                    <h2 style={{ margin: 0 }}>Ment@Bill</h2>
                </Link>


                <nav className="sidebar-nav">
                    <ul>
                        <li
                            className={activeTab === "dashboard" ? "active" : ""}
                            onClick={() => setActiveTab("dashboard")}
                        >
                            <MdDashboard className="nav-icon" />
                            {sidebarOpen && <span>Tableau de bord</span>}
                        </li>
                        <li
                            className={activeTab === "clients" ? "active" : ""}
                            onClick={() => setActiveTab("clients")}
                        >
                            <FaUsers className="nav-icon" />
                            {sidebarOpen && <span>Clients</span>}
                        </li>
                        <li
                            className={activeTab === "factures" ? "active" : ""}
                            onClick={() => setActiveTab("factures")}
                        >
                            <FaFileInvoiceDollar className="nav-icon" />
                            {sidebarOpen && <span>Factures</span>}
                        </li>

                        <li
                            className={activeTab === "stats" ? "active" : ""}
                            onClick={() => setActiveTab("stats")}
                        >
                            <FaChartBar className="nav-icon" />
                            {sidebarOpen && <span>Statistiques</span>}
                        </li>
                        <li
                            className={activeTab === "equipes" ? "active" : ""}
                            onClick={() => setActiveTab("equipes")}
                        >
                            <FaUsers className="nav-icon" />
                            {sidebarOpen && <span>Équipes</span>}
                        </li>
                    </ul>
                </nav>
                <div className="sidebar-footer">
                    <button className="toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? '◄' : '►'}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Navbar */}
                <header className="navbar">
                    <div className="navbar-left">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="navbar-right">
                        <button className="notification-btn">
                            <FaBell />
                            <span className="notification-badge">3</span>
                        </button>
                        <div className="user-profile">
                            <Link
                                to="/profile"
                                className="user-profile "
                            >
                                <FaUserCircle className="user-avatar" />
                                <span>Admin</span>
                            </Link>
                        </div>
                    </div>
                </header>

                <div className="dashboard-container">
                    {renderActiveTab()}
                </div>
            </div>
        </div>
    );
};

export default Dashbill;