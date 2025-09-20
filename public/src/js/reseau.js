// Fichier : public/src/js/reseau.js

import { initModalSlides } from './modalSlide.js';
import { drawConnections } from './dchub_directConnect.js';
import { initChatbot } from './chatbot.js';
import { createAiConfig, getPersonaFromMessage } from './aiConfig.js';

// --- Fonctions de récupération de données ---
async function fetchUsersData() {
    try {
        const response = await fetch('/src/json/users.json');
        if (!response.ok) {
            throw new Error(`Erreur de chargement des données utilisateurs: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la récupération des données utilisateurs:", error);
        return {};
    }
}

async function fetchChatbotData() {
    try {
        const response = await fetch('/src/json/chatbot.json');
        if (!response.ok) {
            throw new Error(`Erreur de chargement des données des chatbots: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la récupération des données des chatbots:", error);
        return {};
    }
}

async function fetchConnectionsData() {
    try {
        const response = await fetch('/src/json/reseau.json');
        if (!response.ok) {
            throw new Error(`Erreur de chargement des connexions: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la récupération des connexions:", error);
        return {};
    }
}

// --- Fonction d'initialisation principale ---
export async function initReseauPage() {
    const usersData = await fetchUsersData();
    const chatbotData = await fetchChatbotData();
    const connectionsData = await fetchConnectionsData();

    // Dynamically create AI configuration from chatbot data
    const { aiModels, aiPersonas } = createAiConfig(chatbotData.bots);

    // Combine users and bots into a single list of nodes for drawing
    const allNodes = [...(usersData.users || []), ...(chatbotData.bots || [])];
    if (allNodes.length === 0) {
        console.error("Aucune donnée d'utilisateur ou de chatbot n'a été trouvée.");
        return;
    }

    const canvas = document.getElementById('reseau-canvas');
    if (!canvas) { return; }
    const ctx = canvas.getContext('2d');
    const profilModal = document.getElementById('profil-modal');
    const profilDetails = document.getElementById('profil-details');
    const closeBtn = profilModal?.querySelector('.close-btn');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const toolIcons = document.querySelectorAll('.tool-icon');

    // Chat elements
    const chatInput = document.getElementById('chat-input');
    const chatForm = document.getElementById('chat-form');
    const chatMessages = document.getElementById('chat-messages');

    let scale = 1.0;
    let iconPositions = [];
    let isDragging = false;
    let draggedNode = null;
    let offsetX = 0;
    let offsetY = 0;
    let draggedTool = null;

    // --- Fonctions internes de l'application ---
    function resizeCanvas() {
        if (!canvas || !canvas.parentElement) return;
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = Math.min(canvas.width * 0.7, 600);
        draw();
    }

    function draw() {
        drawIcons(allNodes);
        drawConnections(ctx, connectionsData.connections, iconPositions);
    }
    
    function drawIcons(nodes) {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        iconPositions = [];
        
        const baseEmojiSize = Math.floor(canvas.width / 10);
        const emojiSize = baseEmojiSize * scale;
        const padding = emojiSize / 2;
        let x = padding;
        let y = padding;

        ctx.font = `${emojiSize}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        nodes.forEach((node) => {
            const emoji = node.emoji || getEmojiForRole(node.role, node.gender);
            
            const existingPos = iconPositions.find(p => p.node.id === node.id);
            const iconX = existingPos ? existingPos.x : x + emojiSize / 2;
            const iconY = existingPos ? existingPos.y : y + emojiSize / 2;

            ctx.beginPath();
            ctx.arc(iconX, iconY, emojiSize / 4, 0, 2 * Math.PI);
            ctx.fillStyle = (node.persona) ? '#007BFF' : '#4CAF50';
            ctx.fill();

            ctx.fillText(emoji, iconX, iconY);

            iconPositions.push({
                x: iconX,
                y: iconY,
                size: emojiSize,
                node: node
            });

            x += emojiSize + padding;
            if (x + emojiSize > canvas.width) {
                x = padding;
                y += emojiSize + padding;
            }
        });
    }

    function getEmojiForRole(role, gender) {
        if (role.includes("Militant")) {
            if (gender === 'male') { return "🧍🏻"; }
            if (gender === 'female') { return "🧍🏻‍♀️"; }
        } else if (role.includes("Développeur")) { return "💻";
        } else if (role.includes("Économie")) { return "📈";
        } else { return "👤"; }
    }

    // --- Fonctions de gestion du Chat ---
    function displayChatMessage(message, role) {
        if (!chatMessages) return;
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${role}`;
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- Fonctions de rendu des listes ---
    function renderUserList(users) {
        const userListContainer = document.getElementById('users-list');
        if (!userListContainer) { return; }
        userListContainer.innerHTML = '';
        users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-list-item';
            const emoji = getEmojiForRole(user.role, user.gender);
            userItem.innerHTML = `<div class="user-list-avatar">${emoji}</div>`;
            userListContainer.appendChild(userItem);
        });
    }

    function renderChatbotList(bots) {
        const chatbotListContainer = document.getElementById('chatbot-list');
        if (!chatbotListContainer) { return; }
        chatbotListContainer.innerHTML = '';
        bots.forEach(bot => {
            const botItem = document.createElement('div');
            botItem.className = 'user-list-item';
            botItem.innerHTML = `<div class="user-list-avatar">${bot.emoji}</div>`;
            chatbotListContainer.appendChild(botItem);
        });
    }

    // --- Attachement des écouteurs d'événements ---
    // Chat Form Submission
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userMessage = chatInput.value;
            if (!userMessage) return;

            displayChatMessage(userMessage, 'user');
            chatInput.value = '';

            try {
                const persona = getPersonaFromMessage(userMessage);
                const response = await fetch('/api/chat/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: userMessage, persona })
                });
                const data = await response.json();
                displayChatMessage(`${data.persona}: ${data.content}`, 'ai');
            } catch (error) {
                console.error('Erreur lors de la communication avec le chatbot:', error);
                displayChatMessage('Désolé, une erreur est survenue.', 'system');
            }
        });
    }

    // Canvas Drop and Drag events
    if (toolIcons) {
        toolIcons.forEach(icon => {
            icon.addEventListener('dragstart', (e) => {
                draggedTool = e.target.getAttribute('data-tool');
                e.dataTransfer.setData('text/plain', draggedTool);
            });
        });
    }

    if (canvas) {
        canvas.addEventListener('dragover', (e) => e.preventDefault());
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const dropX = e.clientX - rect.left;
            const dropY = e.clientY - rect.top;

            if (draggedTool) {
                const targetNode = iconPositions.find(pos => {
                    const dist = Math.sqrt(Math.pow(pos.x - dropX, 2) + Math.pow(pos.y - dropY, 2));
                    return dist < pos.size / 2;
                });

                if (targetNode) {
                    const newConnection = {
                        source_id: `tool_${draggedTool}`,
                        target_id: targetNode.node.id,
                        type: draggedTool
                    };
                    connectionsData.connections.push(newConnection);
                    draw();
                }
                draggedTool = null;
            }
        });
    }

    if (canvas) {
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
        
            for (const pos of iconPositions) {
                const dist = Math.sqrt(Math.pow(pos.x - mouseX, 2) + Math.pow(pos.y - mouseY, 2));
                if (dist < pos.size / 2) {
                    isDragging = true;
                    draggedNode = pos.node;
                    offsetX = mouseX - pos.x;
                    offsetY = mouseY - pos.y;
                    break;
                }
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDragging || !draggedNode) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const draggedIconPos = iconPositions.find(p => p.node.id === draggedNode.id);
            if (draggedIconPos) {
                draggedIconPos.x = mouseX - offsetX;
                draggedIconPos.y = mouseY - offsetY;
                draw();
            }
        });

        canvas.addEventListener('mouseup', () => {
            isDragging = false;
            draggedNode = null;
        });
    }

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            scale = Math.min(scale + 0.1, 2.0);
            draw();
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            scale = Math.max(scale - 0.1, 0.5);
            draw();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (profilModal) profilModal.style.display = "none";
        });
    }

    if (window) { window.addEventListener('resize', resizeCanvas); }

    // Rendu initial des listes et du canvas
    if (usersData && usersData.users) { renderUserList(usersData.users); }
    if (chatbotData && chatbotData.bots) { renderChatbotList(chatbotData.bots); }
    resizeCanvas();
}