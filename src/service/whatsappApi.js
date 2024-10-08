const tokenUrl = 'https://graph.facebook.com/oauth/access_token';
const token = 'EAAQ2pVDAA4oBO7W2xcypUKQwiZByONJVkOFM8yb0j3aLJ1yZAr0KT9C7wf6R2QSQqa3LnRWjPYLOF9pwlMpOrgCHNHDtZC6CWLPIvKJ7MmFxApbea1YMXxPHkX7Xo10nviQakawGVAVpvUcNDpSvjY7ZAXy2dLe3yyngec0uYnNu4zPWaYrAX067wJ4xwyrRpgZDZD';
const clientId = '1185983559107466';
const clientSecret = '396033997a1494eb09bc10d7b9672db0';
const whatsappPhoneNumberId = 395513670310044
const whatsappBusinessAccountId = 399436283250517


export const sendMessage = async (to, content, bodyParams = [], type = 'text', headerParams = []) => {
    const url = `https://graph.facebook.com/v20.0/${whatsappPhoneNumberId}/messages`;


    let body;
    if (type === 'template') {
        body = {
            messaging_product: "whatsapp",
            to: to,
            type: "template",
            template: {
                name: content,
                language: {
                    code: 'en_US'
                },
                components: []
            }
        };

        // Add header parameters if available
        if (headerParams.length > 0) {
            body.template.components.push({
                type: "header",
                parameters: headerParams.map(param => ({ type: "text", text: param }))
            });
        }

        // Add body parameters
        if (bodyParams.length > 0) {
            body.template.components.push({
                type: "body",
                parameters: bodyParams.map(param => ({ type: "text", text: param }))
            });
        }

    } else {
        body = {
            messaging_product: "whatsapp",
            to: to,
            type: "text",
            text: {
                body: content
            }
        };
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log(data);
        if (data.messages && data.messages[0] && data.messages[0].id) {
            return data.messages[0].id;
        } else {
            throw new Error('Message ID not found in response');
        }
    } catch (error) {
        console.error('Error:', error);
        throw error; // re-throw the error after logging it
    }
};

export const getAdminDetails = async () => {
    const url = `https://graph.facebook.com/v20.0/${whatsappBusinessAccountId}/phone_numbers`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch phone numbers');
        }

        const data = await response.json();
        console.log('Fetched Phone Numbers:', data);
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};


export const fetchClientProfile = async (clientPhoneNumber) => {
    const url = `https://graph.facebook.com/v20.0/1185983559107466/contacts`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                blocking: "wait",
                contacts: [clientPhoneNumber]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error fetching client profile:', error);
            return null;
        }

        const data = await response.json();
        const clientProfile = data.contacts[0]; // Assuming contacts[0] contains the profile data

        return {
            name: clientProfile.profile.name,
            profileImage: clientProfile.profile.profile_picture_url,
        };
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
};


export const markMessageAsRead = async (messageId) => {
    const url = `https://graph.facebook.com/v20.0/${whatsappPhoneNumberId}/messages`;


    const body = JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: body
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Message marked as read:', data);
        } else {
            console.error('Failed to mark message as read:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
};


export const createTemplate = async (templateData) => {
    const url = `https://graph.facebook.com/v20.0/${whatsappBusinessAccountId}/message_templates`;


    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(templateData)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error creating template:', error);
            return;
        }

        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
};


export const getTemplates = async () => {
    const url = `https://graph.facebook.com/v20.0/${whatsappBusinessAccountId}/message_templates`;


    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error fetching templates:', error);
            return;
        }

        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
};

// export const getTemplateById = async (templateId) => {
//     const url = `https://graph.facebook.com/v20.0/${templateId}`;

//     try {
//         const response = await fetch(url, {
//             method: 'GET',
//             headers: {
//                 'Authorization': `Bearer ${token}`
//             }
//         });

//         if (!response.ok) {
//             const error = await response.json();
//             console.error('Error fetching template:', error);
//             return;
//         }

//         const data = await response.json();
//         console.log(data);
//         return data;
//     } catch (error) {
//         console.error('Error:', error);
//     }
// };

// export const checkPermissions = async () => {
//     const url = 'https://graph.facebook.com/me?fields=permissions';

//     try {
//         const response = await fetch(url, {
//             method: 'GET',
//             headers: {
//                 'Authorization': `Bearer ${token}`
//             }
//         });

//         if (!response.ok) {
//             const error = await response.json();
//             console.error('Error checking permissions:', error);
//             return;
//         }

//         const data = await response.json();
//         console.log('Permissions:', data);
//         return data;
//     } catch (error) {
//         console.error('Error:', error);
//     }
// };

// checkPermissions();



// export const UpdateToken = () => {
//     // https://graph.facebook.com/oauth/access_token
// }

export const getImageUrl = async (media_id) => {
    const url = `https://graph.facebook.com/v20.0/${media_id}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error fetching templates:', error);
            return;
        }

        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
};

// async function refreshToken() {

//     try {
//         const response = await fetch(tokenUrl, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded',
//             },
//             body: new URLSearchParams({
//                 grant_type: 'fb_exchange_token',
//                 client_id: clientId,
//                 client_secret: clientSecret,
//                 fb_exchange_token: token
//             }),
//         });

//         if (!response.ok) {
//             throw new Error(`Failed to refresh token: ${response.statusText}`);
//         }

//         const data = await response.json();
//         const newToken = data.access_token;

//         // Save the new token to localStorage
//         localStorage.setItem('token', newToken);

//         // Store the time when the token was refreshed
//         const now = Date.now();
//         localStorage.setItem('lastRefreshTime', now);

//         return newToken;
//     } catch (error) {
//         console.error('Error refreshing token:', error);
//         throw new Error('Failed to refresh token');
//     }
// }


// Function to get the token
// export const getToken = async () => {
//     const now = Date.now();
//     const storedToken = localStorage.getItem('token');
//     const lastRefreshTime = parseInt(localStorage.getItem('lastRefreshTime'), 10);

//     // Check if 24 hours have passed since the last refresh
//     const twentyFourHours = 24 * 60 * 60 * 1000;
//     if (!storedToken || (now - lastRefreshTime) >= twentyFourHours) {
//         // Refresh the token if it has expired or not available
//         return await refreshToken();
//     }

//     return storedToken;
// };

