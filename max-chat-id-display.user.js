(function() {
    'use strict';

    const style = document.createElement('style');
    style.textContent = `
        .chat-id-display {
            font-size: 11px;
            color: #888;
            margin-left: 8px;
            font-weight: normal;
            opacity: 0.7;
            font-family: monospace;
        }
    `;
    document.head.appendChild(style);

    const chatIdMap = new Map();

    const contactIdMap = new Map();

    const contactsDataMap = new Map();

    const elementIdMap = new WeakMap();

    let currentSelectedElement = null;

    let profileUserId = null;

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
        originalPushState.apply(history, args);
        extractIdFromUrl();
    };

    history.replaceState = function(...args) {
        originalReplaceState.apply(history, args);
        extractIdFromUrl();
    };

    window.addEventListener('popstate', extractIdFromUrl);

    function extractIdFromUrl() {
        const url = window.location.href;

        const patterns = [
            /\/chat\/(\d+)/i,
            /\/chat-(\d+)/i,
            /chatId=(\d+)/i,
            /id=(\d+)/i,
            /\/(\d+)(?:\?|$)/i
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {

                window.lastChatId = match[1];
                return match[1];
            }
        }
        return null;
    }

    function getChatTitle(chatElement) {
        const titleElement = chatElement.querySelector('.title .text') ||
                            chatElement.querySelector('h3.title .text') ||
                            chatElement.querySelector('.title') ||
                            chatElement.querySelector('h3.title');
        if (titleElement) {
            return titleElement.textContent.trim();
        }
        return null;
    }

    function extractChatId(chatElement) {

        if (elementIdMap.has(chatElement)) {
            return elementIdMap.get(chatElement);
        }

        const title = getChatTitle(chatElement);
        if (title && chatIdMap.has(title)) {
            const id = chatIdMap.get(title);
            elementIdMap.set(chatElement, id);
            return id;
        }

        return null;
    }

    function addChatId(chatElement) {
        const titleElement = chatElement.querySelector('.title') || chatElement.querySelector('h3.title');
        if (!titleElement) return;

        const oldId = titleElement.querySelector('.chat-id-display');
        if (oldId) {
            oldId.remove();
        }

        const chatId = extractChatId(chatElement);

        if (chatId) {
            const idSpan = document.createElement('span');
            idSpan.className = 'chat-id-display';
            idSpan.textContent = `[${chatId}]`;
            titleElement.appendChild(idSpan);
        }
    }

    function getContactName(contactElement) {
        const nameElement = contactElement.querySelector('.name .text') ||
                           contactElement.querySelector('.title .text') ||
                           contactElement.querySelector('.name') ||
                           contactElement.querySelector('.title');
        if (nameElement) {
            return nameElement.textContent.trim();
        }
        return null;
    }

    function getContactIdentifiers(contactElement) {
        const identifiers = [];
        const name = getContactName(contactElement);
        if (name) {
            identifiers.push(name);

            const parts = name.split(' ');
            if (parts.length > 1) {
                identifiers.push(parts[0]);
                identifiers.push(parts.join(' '));
            }
        }
        return identifiers;
    }

    function extractContactId(contactElement) {
        if (elementIdMap.has(contactElement)) {
            return elementIdMap.get(contactElement);
        }

        const identifiers = getContactIdentifiers(contactElement);
        for (const identifier of identifiers) {
            if (contactIdMap.has(identifier)) {
                const id = contactIdMap.get(identifier);
                elementIdMap.set(contactElement, id);
                return id;
            }
        }

        return null;
    }

    function addContactId(contactElement) {
        const titleElement = contactElement.querySelector('.title') ||
                            contactElement.querySelector('.name') ||
                            contactElement.querySelector('h3.title');
        if (!titleElement) return;

        const oldId = titleElement.querySelector('.chat-id-display');
        if (oldId) {
            oldId.remove();
        }

        const contactId = extractContactId(contactElement);
        if (contactId) {
            const idSpan = document.createElement('span');
            idSpan.className = 'chat-id-display';
            idSpan.textContent = `[${contactId}]`;
            titleElement.appendChild(idSpan);
        }
    }

    function processChats() {

        const chatSelectors = [
            '.item.svelte-rg2upy',
            '[class*="item"][class*="chat"]',
            '.wrapper.wrapper--withActions'
        ];

        let chats = [];
        for (const selector of chatSelectors) {
            chats = document.querySelectorAll(selector);
            if (chats.length > 0) break;
        }

        chats.forEach(chat => {

            const contactId = extractContactId(chat);
            if (!contactId) {
                addChatId(chat);
            }
        });
    }

    function processContacts() {

        const allItems = document.querySelectorAll('.item.svelte-rg2upy, .wrapper.wrapper--withActions, [class*="item"]');

        allItems.forEach(item => {

            const chatId = extractChatId(item);
            if (!chatId) {

                const contactId = extractContactId(item);
                if (contactId) {
                    addContactId(item);
                }
            }
        });

        const contactSelectors = [
            '[class*="contact"]:not(.item.svelte-rg2upy)',
            '[class*="user"]:not(.item.svelte-rg2upy)'
        ];

        contactSelectors.forEach(selector => {
            try {
                const contacts = document.querySelectorAll(selector);
                contacts.forEach(contact => {
                    addContactId(contact);
                });
            } catch (e) {

            }
        });
    }

    function processProfilePage() {
        if (!profileUserId) return;

        if (document.querySelector('.profile-copy-id-button')) return;

        let buttonContainer = null;

        const bottomGroup = document.querySelector('.bottomGroup.svelte-174ybgs') ||
                           document.querySelector('[class*="bottomGroup"]') ||
                           document.querySelector('.bottomGroup');

        if (bottomGroup) {
            buttonContainer = bottomGroup;
        }

        if (buttonContainer) {

            const button = document.createElement('button');
            button.className = 'button svelte-xwrwgf profile-copy-id-button';

            const iconSpan = document.createElement('span');
            iconSpan.className = 'icon svelte-xwrwgf';
            iconSpan.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            `;

            const titleSpan = document.createElement('span');
            titleSpan.className = 'title svelte-xwrwgf';
            titleSpan.textContent = 'Скопировать ID';

            button.appendChild(iconSpan);
            button.appendChild(titleSpan);

            button.addEventListener('click', () => {
                copyToClipboard(String(profileUserId));
                const originalText = titleSpan.textContent;
                titleSpan.textContent = 'ID скопирован!';
                setTimeout(() => {
                    titleSpan.textContent = originalText;
                }, 2000);
            });

            buttonContainer.appendChild(button);
            console.log('Кнопка копирования ID профиля добавлена в bottomGroup');
        }
    }

    processChats();
    processContacts();
    processProfilePage();

    setInterval(() => {
        if (contactIdMap.size > 0) {
            processContacts();
        }
        if (profileUserId) {
            processProfilePage();
        }
    }, 2000);

    const observer = new MutationObserver((mutations) => {
        let shouldProcess = false;
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        if (node.classList?.contains('item') ||
                            node.querySelector?.('.item') ||
                            node.classList?.contains('wrapper') ||
                            node.classList?.contains('contact') ||
                            node.querySelector?.('[class*="contact"]')) {
                            shouldProcess = true;
                        }
                    }
                });
            }
        });
        if (shouldProcess) {
            setTimeout(() => {
                processChats();
                processContacts();

                if (window.location.href.includes('/profile') ||
                    window.location.href.includes('/settings') ||
                    window.location.href.includes('/edit') ||
                    document.querySelector('[class*="profile"]') ||
                    document.querySelector('[class*="settings"]')) {
                    processProfilePage();
                }
            }, 100);
        }

        if (contactIdMap.size > 0) {
            setTimeout(() => {
                processContacts();
            }, 500);
        }
        if (profileUserId) {
            setTimeout(() => {
                processProfilePage();
            }, 500);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(() => {
                processChats();

                if (url.includes('/profile') || url.includes('/settings') || url.includes('/edit')) {
                    setTimeout(processProfilePage, 500);
                }
            }, 500);
        }
    }).observe(document, { subtree: true, childList: true });

    setTimeout(() => {

        if (window.__SVELTEKIT__ || window.__svelte || window.app) {

            const checkSvelteState = () => {
                try {

                    const possibleStates = [
                        window.__SVELTEKIT__,
                        window.__svelte,
                        window.app,
                        document.querySelector('#app')?.__svelte
                    ];

                    for (const state of possibleStates) {
                        if (state && typeof state === 'object') {

                            const chatData = findChatDataInObject(state);
                            if (chatData) {
                                applyChatIds(chatData);
                                return true;
                            }
                        }
                    }
                } catch (e) {
                    console.log('Не удалось получить состояние Svelte:', e);
                }
                return false;
            };

            const findChatDataInObject = (obj, depth = 0) => {
                if (depth > 5) return null;
                if (!obj || typeof obj !== 'object') return null;

                const chatKeys = ['chats', 'chatList', 'items', 'data', 'state'];
                for (const key of chatKeys) {
                    if (obj[key] && Array.isArray(obj[key])) {
                        return obj[key];
                    }
                }

                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        const result = findChatDataInObject(obj[key], depth + 1);
                        if (result) return result;
                    }
                }
                return null;
            };

            const applyChatIds = (chatData) => {
                chatData.forEach((chat, index) => {
                    if (chat && chat.id) {
                        const chatElements = document.querySelectorAll('.item.svelte-rg2upy');
                        if (chatElements[index]) {
                            const titleElement = chatElements[index].querySelector('.title');
                            if (titleElement && !titleElement.querySelector('.chat-id-display')) {
                                const idSpan = document.createElement('span');
                                idSpan.className = 'chat-id-display';
                                idSpan.textContent = `[${chat.id}]`;
                                titleElement.appendChild(idSpan);
                            }
                        }
                    }
                });
            };

            checkSvelteState();
        }
    }, 2000);

    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        return originalFetch.apply(this, args).then(response => {
            const url = args[0];
            if (typeof url === 'string' && (url.includes('/chat') || url.includes('/api'))) {

                const idMatch = url.match(/chat[\/\-]?(\d+)/i) || url.match(/\/(\d+)(?:\?|$)/);
                if (idMatch && idMatch[1]) {
                    const chatId = idMatch[1];

                    setTimeout(() => {
                        const chatElements = document.querySelectorAll('.item.svelte-rg2upy');
                        chatElements.forEach((el, index) => {
                            const button = el.querySelector('button.cell') || el.querySelector('button');
                            if (button && !chatIdMap.has(button)) {

                                chatIdMap.set(button, chatId);
                            }
                        });
                        processChats();
                    }, 100);
                }

                response.clone().json().then(data => {
                    if (data && typeof data === 'object') {
                        const chatData = findChatDataInResponse(data);
                        if (chatData && Array.isArray(chatData)) {
                            chatData.forEach((chat, index) => {
                                if (chat && (chat.id || chat.chatId || chat.chat_id)) {
                                    const chatId = chat.id || chat.chatId || chat.chat_id;
                                    const chatElements = document.querySelectorAll('.item.svelte-rg2upy');
                                    if (chatElements[index]) {
                                        const button = chatElements[index].querySelector('button.cell') ||
                                                     chatElements[index].querySelector('button');
                                        if (button) {
                                            chatIdMap.set(button, String(chatId));
                                        }
                                    }
                                }
                            });
                            processChats();
                        }
                    }
                }).catch(() => {});
            }
            return response;
        });
    };

    function findChatDataInResponse(obj, depth = 0) {
        if (depth > 5) return null;
        if (!obj || typeof obj !== 'object') return null;

        if (Array.isArray(obj)) {
            if (obj.length > 0 && obj[0] && (obj[0].id || obj[0].chatId || obj[0].chat_id)) {
                return obj;
            }
        }

        const chatKeys = ['chats', 'chatList', 'items', 'data', 'results', 'list'];
        for (const key of chatKeys) {
            if (obj[key] && Array.isArray(obj[key])) {
                return obj[key];
            }
        }

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const result = findChatDataInResponse(obj[key], depth + 1);
                if (result) return result;
            }
        }
        return null;
    }

    function interceptWebSocket() {
        const OriginalWebSocket = window.WebSocket;

        window.WebSocket = function(...args) {
            const ws = new OriginalWebSocket(...args);

            const processMessage = function(event) {
                try {

                    const data = JSON.parse(event.data);

                    if (data.payload && data.payload.chats && Array.isArray(data.payload.chats)) {
                        let updated = false;
                        data.payload.chats.forEach(chat => {
                            const chatId = chat.id !== undefined ? chat.id : (chat.cid !== undefined ? chat.cid : null);

                            if (chatId !== null && chat.title) {
                                const oldId = chatIdMap.get(chat.title);
                                if (oldId !== chatId) {
                                    chatIdMap.set(chat.title, chatId);
                                    console.log(`Найден чат: "${chat.title}" -> ID: ${chatId}`);
                                    updated = true;
                                }
                            }
                        });

                        if (updated) {
                            setTimeout(processChats, 100);
                        }
                    }

                    if (data.payload && data.payload.profile) {
                        const userId = data.payload.profile.id ||
                                      data.payload.profile.contact?.id;

                        if (userId && profileUserId !== userId) {
                            profileUserId = userId;
                            console.log(`Найден ID профиля: ${userId}`);

                            setTimeout(() => {
                                processProfilePage();
                            }, 500);
                        }
                    }

                    if (data.payload && data.payload.contacts && Array.isArray(data.payload.contacts)) {
                        let updated = false;
                        data.payload.contacts.forEach(contact => {
                            if (contact.id !== undefined) {

                                contactsDataMap.set(contact.id, contact);

                                const identifiers = [];

                                if (contact.names && contact.names.length > 0) {
                                    contact.names.forEach(nameObj => {
                                        if (nameObj.name) identifiers.push(nameObj.name);
                                        if (nameObj.firstName) {
                                            identifiers.push(nameObj.firstName);
                                            if (nameObj.lastName) {
                                                identifiers.push(`${nameObj.firstName} ${nameObj.lastName}`);
                                            }
                                        }
                                    });
                                }

                                if (contact.phone) {
                                    identifiers.push(String(contact.phone));
                                }

                                identifiers.forEach(identifier => {
                                    if (identifier) {
                                        const oldId = contactIdMap.get(identifier);
                                        if (oldId !== contact.id) {
                                            contactIdMap.set(identifier, contact.id);
                                            console.log(`Найден контакт: "${identifier}" -> ID: ${contact.id}`);
                                            updated = true;
                                        }
                                    }
                                });
                            }
                        });

                        if (updated) {
                            setTimeout(() => {
                                processContacts();
                                processChats();
                            }, 100);
                        }
                    }
                } catch (e) {

                }
            };

            const originalAddEventListener = ws.addEventListener.bind(ws);
            ws.addEventListener = function(type, listener, options) {
                if (type === 'message') {

                    originalAddEventListener('message', processMessage);

                    return originalAddEventListener(type, listener, options);
                }
                return originalAddEventListener(type, listener, options);
            };

            let originalOnMessage = null;
            Object.defineProperty(ws, 'onmessage', {
                get: function() {
                    return originalOnMessage;
                },
                set: function(handler) {
                    originalOnMessage = handler;

                    originalAddEventListener('message', processMessage);
                    if (handler) {
                        originalAddEventListener('message', handler);
                    }
                }
            });

            return ws;
        };

        window.WebSocket.prototype = OriginalWebSocket.prototype;
        Object.setPrototypeOf(window.WebSocket, OriginalWebSocket);
    }

    interceptWebSocket();

    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                console.log('ID скопирован:', text);
            }).catch(err => {
                console.error('Ошибка копирования:', err);

                fallbackCopyToClipboard(text);
            });
        } else {
            fallbackCopyToClipboard(text);
        }
    }

    function fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            console.log('ID скопирован (fallback):', text);
        } catch (err) {
            console.error('Ошибка копирования (fallback):', err);
        }
        document.body.removeChild(textArea);
    }

    function getSelectedElementId(element) {

        const chatElement = element.closest('.item.svelte-rg2upy') ||
                          element.closest('.wrapper.wrapper--withActions') ||
                          element.closest('[class*="item"]');

        if (chatElement) {
            const chatId = extractChatId(chatElement);
            if (chatId) return chatId;

            const contactId = extractContactId(chatElement);
            if (contactId) return contactId;
        }

        return null;
    }

    function addCopyIdButton() {

        const menuObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {

                        const menu = node.querySelector('[role="dialog"]') ||
                                    node.querySelector('[class*="menu"]') ||
                                    node.querySelector('[class*="popover"]') ||
                                    node.querySelector('[class*="Popover"]') ||
                                    (node.matches && (node.matches('[role="dialog"]') ||
                                     node.matches('[class*="menu"]') ||
                                     node.matches('[class*="popover"]')) ? node : null);

                        if (menu && !menu.querySelector('.copy-chat-id-button')) {

                            const menuButtons = menu.querySelectorAll('button, [role="menuitem"]');
                            if (menuButtons.length > 0) {

                                const chatItem = currentSelectedElement ||
                                               document.querySelector('.item.svelte-rg2upy:hover') ||
                                               document.querySelector('.wrapper.wrapper--withActions:hover');

                                if (chatItem) {
                                    const id = getSelectedElementId(chatItem);
                                    if (id) {

                                        const copyButton = document.createElement('button');
                                        copyButton.className = 'copy-chat-id-button';
                                        copyButton.setAttribute('role', 'menuitem');
                                        copyButton.textContent = 'Скопировать ID';

                                        const firstButton = menuButtons[0];
                                        if (firstButton) {
                                            const computedStyle = window.getComputedStyle(firstButton);
                                            copyButton.style.cssText = `
                                                width: 100%;
                                                padding: ${computedStyle.padding || '8px 16px'};
                                                text-align: left;
                                                border: none;
                                                background: transparent;
                                                cursor: pointer;
                                                font-size: ${computedStyle.fontSize || '14px'};
                                                color: ${computedStyle.color || 'inherit'};
                                                font-family: ${computedStyle.fontFamily || 'inherit'};
                                                display: flex;
                                                align-items: center;
                                            `;
                                        } else {
                                            copyButton.style.cssText = `
                                                width: 100%;
                                                padding: 8px 16px;
                                                text-align: left;
                                                border: none;
                                                background: transparent;
                                                cursor: pointer;
                                                font-size: 14px;
                                            `;
                                        }

                                        copyButton.addEventListener('mouseenter', () => {
                                            copyButton.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                                        });
                                        copyButton.addEventListener('mouseleave', () => {
                                            copyButton.style.backgroundColor = 'transparent';
                                        });

                                        copyButton.addEventListener('click', (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            copyToClipboard(String(id));

                                            const originalText = copyButton.textContent;
                                            copyButton.textContent = '✓ ID скопирован!';
                                            copyButton.style.color = '#4CAF50';
                                            setTimeout(() => {
                                                copyButton.textContent = originalText;
                                                copyButton.style.color = '';
                                            }, 2000);
                                        });

                                        const container = firstButton?.parentElement || menu;
                                        if (container) {

                                            const separator = document.createElement('div');
                                            separator.style.cssText = 'height: 1px; background: rgba(0,0,0,0.1); margin: 4px 0;';

                                            container.insertBefore(copyButton, container.firstChild);
                                            container.insertBefore(separator, copyButton.nextSibling);
                                        } else {
                                            menu.appendChild(copyButton);
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            });
        });

        menuObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        document.addEventListener('contextmenu', (e) => {
            const target = e.target;
            const chatItem = target.closest('.item.svelte-rg2upy') ||
                           target.closest('.wrapper.wrapper--withActions') ||
                           target.closest('[class*="item"]');
            if (chatItem) {
                currentSelectedElement = chatItem;

                setTimeout(() => {
                    if (currentSelectedElement === chatItem) {
                        currentSelectedElement = null;
                    }
                }, 5000);
            }
        }, true);
    }

    addCopyIdButton();

    console.log('Скрипт показа ID чатов и контактов загружен. Ожидание данных из WebSocket...');
})();