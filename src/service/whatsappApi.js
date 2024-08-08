const token = 'EAAQ2pVDAA4oBOZCqWgZC7csOI91aqNVttTqH0KBHUGk03zoXEIZCFkxc1FqLX4KrJIY06q36xTVyr0RGXAaj6zNxvpBZCU030Ff1Q4ZC5Vp4APCird5g6x558nWcHc7bWUq25r8PCLhDpBFujmsn9xA9W6w6Cfz1b1YxZBbifgdtNUoVZC32RfuwGofxtkitX1Dq4tZC2ccmFOXcmhiadJ8ZD';
const whatsappPhoneNumberId = 395513670310044
const whatsappBusinessAccountId = 399436283250517


export const sendMessage = async (to, content, params = [], type = 'text') => {
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
                components: [
                    {
                        type: "body",
                        parameters: params.map(param => ({ type: "text", text: param }))
                    }
                ]
            }
        };
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
    console.log("templateData: ", templateData);
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

export const getTemplateById = async (templateId) => {
    const url = `https://graph.facebook.com/v20.0/${templateId}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error fetching template:', error);
            return;
        }

        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
};

export const checkPermissions = async () => {
    const url = 'https://graph.facebook.com/me?fields=permissions';

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error checking permissions:', error);
            return;
        }

        const data = await response.json();
        console.log('Permissions:', data);
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
};

checkPermissions();



export const UpdateToken = () => {
    // https://graph.facebook.com/oauth/access_token
}