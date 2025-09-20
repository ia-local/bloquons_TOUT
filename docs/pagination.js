// public/pagination.js

// DOM elements will now be passed to the functions, not globally retrieved
let currentPage = 1;
let itemsPerPage = 5; // Default value, can be overridden

// Callbacks from main app logic (cv.js)
let selectConversationCallback = null;
let deleteConversationCallback = null;
let fetchConversationsCallback = null;
let activeConversationId = null; // Track the currently active conversation

/**
 * Initializes pagination controls with necessary callbacks and DOM elements.
 * @param {HTMLElement} prevBtn - The previous page button element.
 * @param {HTMLElement} nextBtn - The next page button element.
 * @param {HTMLElement} currentPageInfoEl - The element displaying current page info.
 * @param {function} fetchConversationsCb - Callback to fetch conversations for a given page.
 * @param {function} selectConversationCb - Callback to select a conversation.
 * @param {function} deleteConversationCb - Callback to delete a conversation.
 */
export function initPaginationControls(prevBtn, nextBtn, currentPageInfoEl, fetchConversationsCb, selectConversationCb, deleteConversationCb) {
    fetchConversationsCallback = fetchConversationsCb;
    selectConversationCallback = selectConversationCb;
    deleteConversationCallback = deleteConversationCb;

    // Remove existing listeners to prevent duplicates if init is called multiple times
    if (prevBtn) {
        prevBtn.removeEventListener('click', handlePrevClick);
        prevBtn.addEventListener('click', handlePrevClick);
    }
    if (nextBtn) {
        nextBtn.removeEventListener('click', handleNextClick);
        nextBtn.addEventListener('click', handleNextClick);
    }

    function handlePrevClick() {
        if (currentPage > 1) {
            currentPage--;
            fetchConversationsCallback(currentPage);
        }
    }

    function handleNextClick() {
        // totalPages is calculated dynamically inside renderChatConversationList,
        // so we don't need it here. The button will be disabled if on last page.
        currentPage++; // Increment first, then fetch. fetch will adjust if out of bounds.
        fetchConversationsCallback(currentPage);
    }
}

/**
 * Sets the current active conversation ID to highlight it in the list.
 * @param {string|null} id - The ID of the conversation to set as active, or null to clear.
 */
export function setActiveConversationId(id) {
    activeConversationId = id;
    // No direct re-render here, the call will come from cv.js's fetchConversations
}


/**
 * Sets the conversations data and updates pagination properties.
 * @param {Array<Object>} conversationsData - Array of conversation objects for the current page.
 * @param {number} totalCount - Total number of conversations available.
 * @param {number} page - Current page number.
 * @param {number} perPage - Number of items per page.
 */
let currentConversationsData = { conversations: [], totalCount: 0 };
export function setConversations(conversationsData, totalCount, page, perPage) {
    currentConversationsData.conversations = conversationsData; // Store current page's data
    currentConversationsData.totalCount = totalCount; // Store total count
    currentPage = page;
    itemsPerPage = perPage;
}

/**
 * Renders the chat conversation list into a specified target element.
 * This function should be called after `setConversations`.
 * @param {HTMLElement} targetListElement - The <ul> element where conversations should be rendered.
 * @param {HTMLElement} prevBtn - The previous page button element.
 * @param {HTMLElement} nextBtn - The next page button element.
 * @param {HTMLElement} currentPageInfoEl - The element displaying current page info.
 * @param {function} selectCb - The callback function to execute when a conversation is selected.
 * @param {function} deleteCb - The callback function to execute when a conversation is deleted.
 */
export function renderChatConversationList(targetListElement, prevBtn, nextBtn, currentPageInfoEl, selectCb, deleteCb) {
    if (!targetListElement) {
        console.error("Target list element is null in renderChatConversationList.");
        return;
    }

    targetListElement.innerHTML = '';
    const conversations = currentConversationsData.conversations;
    const totalCount = currentConversationsData.totalCount;
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    if (!conversations || conversations.length === 0) {
        targetListElement.innerHTML = '<li class="placeholder-text">Aucune conversation. Cliquez sur "Nouvelle" pour commencer.</li>';
        if (currentPageInfoEl) currentPageInfoEl.textContent = 'Page 0/0';
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        return;
    }

    conversations.forEach(conv => {
        const li = document.createElement('li');
        li.className = `conversation-item ${conv.id === activeConversationId ? 'active' : ''}`;
        li.dataset.id = conv.id;
        li.innerHTML = `
            <span>${conv.title || `Conversation ${new Date(conv.createdAt).toLocaleString()}`}</span>
            <button class="delete-conversation-btn" data-id="${conv.id}" title="Supprimer la conversation"><i class="fas fa-trash-alt"></i></button>
        `;
        li.addEventListener('click', (e) => {
            // Only trigger select if not clicking the delete button
            if (!e.target.closest('.delete-conversation-btn')) {
                selectCb(conv.id);
            }
        });

        const deleteButton = li.querySelector('.delete-conversation-btn');
        if (deleteButton) {
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent li click event from firing
                deleteCb(e.currentTarget.dataset.id);
            });
        }
        targetListElement.appendChild(li);
    });

    // Update pagination controls display
    if (currentPageInfoEl) currentPageInfoEl.textContent = `Page ${currentPage}/${totalPages}`;
    if (prevBtn) prevBtn.disabled = (currentPage <= 1);
    if (nextBtn) nextBtn.disabled = (currentPage >= totalPages);
}
