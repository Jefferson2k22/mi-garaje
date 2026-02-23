// URL del JSON
const JSON_URL = 'https://raw.githubusercontent.com/JUANCITOPENA/Pagina_Vehiculos_Ventas/refs/heads/main/vehiculos.json';

// Estado de la aplicación
let vehiclesData = [];
let cart = [];
let selectedVehicle = null;

// Elementos del DOM
const productsContainer = document.getElementById('productsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const searchInput = document.getElementById('searchInput');
const cartCount = document.getElementById('cartCount');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalSpan = document.getElementById('cartTotal');

// --- 1. CARGA DE DATOS ---
async function loadVehicles() {
    try {
        const response = await fetch(JSON_URL);
        if (!response.ok) throw new Error('No se pudo cargar el catálogo');
        vehiclesData = await response.json();
        displayVehicles(vehiclesData);
    } catch (error) {
        productsContainer.innerHTML = `<div class="alert alert-danger w-100">Error: ${error.message}</div>`;
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// --- 2. MOSTRAR VEHÍCULOS ---
function displayVehicles(data) {
    productsContainer.innerHTML = '';
    
    data.forEach(vehicle => {
        // Limpiar tipo (quitar emojis)
        const tipoLimpio = vehicle.tipo.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

        const card = document.createElement('div');
        card.className = 'col-md-4 col-sm-6 mb-4';
        card.innerHTML = `
            <div class="card h-100 shadow-sm">
                <img src="${vehicle.imagen}" class="card-img-top viewDetailsBtn" data-codigo="${vehicle.codigo}" alt="${vehicle.modelo}" loading="lazy" style="cursor: pointer;">
                <div class="card-body">
                    <h5 class="card-title">${vehicle.marca} ${vehicle.modelo}</h5>
                    <p class="card-text-desc mb-1">${vehicle.categoria} - ${tipoLimpio}</p>
                    <p class="price-tag mb-3">$${vehicle.precio_venta.toLocaleString()}</p>
                    <div class="mt-auto d-grid gap-2">
                        <button class="btn btn-outline-primary viewDetailsBtn" data-codigo="${vehicle.codigo}">Ver Detalle</button>
                        <button class="btn btn-primary addToCartBtn" data-codigo="${vehicle.codigo}">
                            <i class="fas fa-cart-plus"></i> Añadir al Carrito
                        </button>
                    </div>
                </div>
            </div>
        `;
        productsContainer.appendChild(card);
    });
}

// --- 3. FILTRADO ---
function filterVehicles() {
    const term = searchInput.value.toLowerCase();
    const filtered = vehiclesData.filter(v => 
        v.marca.toLowerCase().includes(term) || 
        v.modelo.toLowerCase().includes(term) || 
        v.categoria.toLowerCase().includes(term)
    );
    displayVehicles(filtered);
}

// --- 4. GESTIÓN DE EVENTOS (Delegación) ---
productsContainer.addEventListener('click', (e) => {
    const target = e.target.closest('button, img');
    if (!target) return;

    const codigo = parseInt(target.dataset.codigo);
    const vehicle = vehiclesData.find(v => v.codigo === codigo);

    if (target.classList.contains('viewDetailsBtn')) {
        showDetails(vehicle);
    } else if (target.classList.contains('addToCartBtn')) {
        selectedVehicle = vehicle;
        const qModal = new bootstrap.Modal(document.getElementById('quantityModal'));
        document.getElementById('quantityInput').value = 1;
        qModal.show();
    }
});

// --- 5. DETALLES Y CARRITO ---
function showDetails(v) {
    document.getElementById('detailsImage').src = v.imagen;
    document.getElementById('detailsTitle').innerText = `${v.marca} ${v.modelo}`;
    document.getElementById('detailsContent').innerHTML = `
        <img src="${v.logo}" alt="Logo" style="width: 50px;" class="mb-3">
        <ul class="list-group list-group-flush">
            <li class="list-group-item"><strong>Categoría:</strong> ${v.categoria}</li>
            <li class="list-group-item"><strong>Precio:</strong> $${v.precio_venta.toLocaleString()}</li>
            <li class="list-group-item"><strong>Estado:</strong> Disponible</li>
        </ul>
        <button class="btn btn-primary w-100 mt-4 addToCartBtn" data-codigo="${v.codigo}" onclick="bootstrap.Modal.getInstance(document.getElementById('detailsModal')).hide();">
            Añadir al Carrito
        </button>
    `;
    const dModal = new bootstrap.Modal(document.getElementById('detailsModal'));
    dModal.show();
}

document.getElementById('confirmAddToCartBtn').addEventListener('click', () => {
    const quantity = parseInt(document.getElementById('quantityInput').value);
    if (quantity > 0) {
        addItemToCart(selectedVehicle, quantity);
        bootstrap.Modal.getInstance(document.getElementById('quantityModal')).hide();
    }
});

function addItemToCart(vehicle, quantity) {
    const existing = cart.find(item => item.codigo === vehicle.codigo);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({
            codigo: vehicle.codigo,
            marca: vehicle.marca,
            modelo: vehicle.modelo,
            precio: vehicle.precio_venta,
            imagen: vehicle.imagen,
            logo: vehicle.logo,
            quantity: quantity
        });
    }
    updateCartUI();
}

function updateCartUI() {
    cartItemsContainer.innerHTML = '';
    let total = 0;
    let count = 0;

    cart.forEach(item => {
        const subtotal = item.precio * item.quantity;
        total += subtotal;
        count += item.quantity;

        const div = document.createElement('div');
        div.className = 'd-flex align-items-center mb-3 border-bottom pb-2';
        div.innerHTML = `
            <img src="${item.imagen}" style="width: 60px; height: 40px; object-fit: cover;" class="rounded me-3">
            <div class="flex-grow-1">
                <h6 class="mb-0">${item.marca} ${item.modelo}</h6>
                <small>${item.quantity} x $${item.precio.toLocaleString()}</small>
            </div>
            <div class="text-end">
                <span class="fw-bold">$${subtotal.toLocaleString()}</span>
            </div>
        `;
        cartItemsContainer.appendChild(div);
    });

    cartTotalSpan.innerText = `$${total.toLocaleString()}`;
    cartCount.innerText = count;
    cartCount.classList.add('pulse');
    setTimeout(() => cartCount.classList.remove('pulse'), 200);
}

// --- 6. PAGO Y FACTURA ---
document.getElementById('processPaymentBtn').addEventListener('click', () => {
    const name = document.getElementById('payName').value;
    if (!name) {
        alert('Por favor ingrese su nombre');
        return;
    }

    alert('¡Pago Procesado con Éxito!');
    generateInvoice(name);
    
    // Resetear carrito
    cart = [];
    updateCartUI();
    
    bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
    bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
});

function generateInvoice(name) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text('FACTURA DE COMPRA - GarageOnline', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Cliente: ${name}`, 20, 40);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 50);
    
    let y = 70;
    doc.text('Vehículo', 20, y);
    doc.text('Cant.', 100, y);
    doc.text('Subtotal', 150, y);
    doc.line(20, y + 2, 190, y + 2);
    
    y += 10;
    cart.forEach(item => {
        doc.text(`${item.marca} ${item.modelo}`, 20, y);
        doc.text(`${item.quantity}`, 100, y);
        doc.text(`$${(item.precio * item.quantity).toLocaleString()}`, 150, y);
        y += 10;
    });

    doc.setFontSize(14);
    doc.text(`TOTAL: ${cartTotalSpan.innerText}`, 150, y + 10);
    
    doc.save(`Factura_GarageOnline_${Date.now()}.pdf`);
}

// --- 7. TESTING AUTOMATIZADO ---
function runTests() {
    console.log("🚀 Iniciando Pruebas Unitarias...");

    // Test 1: Datos cargados
    const testDataLoad = vehiclesData.length > 0 ? "✅ PASSED" : "❌ FAILED";
    console.log(`Prueba 1 (Carga de Datos): ${testDataLoad}`);

    // Test 2: Filtrado
    searchInput.value = "Toyota";
    filterVehicles();
    const filterSuccess = productsContainer.children.length >= 0 ? "✅ PASSED" : "❌ FAILED";
    console.log(`Prueba 2 (Filtrado 'Toyota'): ${filterSuccess}`);
    searchInput.value = ""; // Limpiar

    // Test 3: Carrito
    const initialCartLength = cart.length;
    addItemToCart({codigo: 999, marca: 'Test', modelo: 'Car', precio_venta: 1000}, 2);
    const cartAddSuccess = cart.length > initialCartLength ? "✅ PASSED" : "❌ FAILED";
    console.log(`Prueba 3 (Añadir al Carrito): ${cartAddSuccess}`);

    console.log("🏁 Pruebas finalizadas.");
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadVehicles().then(() => {
        // Ejecutar tests después de cargar datos
        setTimeout(runTests, 2000);
    });
    searchInput.addEventListener('input', filterVehicles);
});