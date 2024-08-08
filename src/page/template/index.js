import React, { useState, useEffect } from 'react';
import { createTemplate } from '../../service/whatsappApi';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';

export default function Template() {
    const [title, setTitle] = useState('');
    const [headerText, setHeaderText] = useState('');
    const [body, setBody] = useState('');
    const [showFooter, setShowFooter] = useState(false);
    const [footerText, setFooterText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [headerType, setHeaderType] = useState('TEXT');
    const [headerImage, setHeaderImage] = useState(null);
    const [buttons, setButtons] = useState([]);
    const [buttonType, setButtonType] = useState('URL');
    const [buttonText, setButtonText] = useState('');
    const [buttonUrl, setButtonUrl] = useState('');
    const [showButtons, setShowButtons] = useState(false);

    // Separate states for dynamic fields
    const [headerDynamicField, setHeaderDynamicField] = useState('');
    const [bodyDynamicFields, setBodyDynamicFields] = useState({});
    console.log("bodyDynamicFields: ", bodyDynamicFields);

    const extractPlaceholders = (text) => {
        const regex = /{{(\d+)}}/g;
        const placeholders = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            placeholders.push(match[1]);
        }
        return placeholders;
    };

    useEffect(() => {
        const placeholders = extractPlaceholders(headerText);
        setHeaderDynamicField(placeholders.length > 0 ? '' : null);
    }, [headerText]);

    useEffect(() => {
        const placeholders = extractPlaceholders(body);
        const fields = placeholders.reduce((acc, placeholder) => {
            if (!acc[placeholder]) {
                acc[placeholder] = '';
            }
            return acc;
        }, {});
        setBodyDynamicFields(fields);
    }, [body]);
    

    const handleHeaderDynamicFieldChange = (value) => {
        setHeaderDynamicField(value);
    };

    const handleBodyDynamicFieldChange = (key, value) => {
        setBodyDynamicFields((prevFields) => ({
            ...prevFields,
            [key]: value,
        }));
    };


    const handleAddButton = () => {
        if (buttonText.trim() === '') {
            setError('Button text is required.');
            return;
        }
        const newButton = {
            type: buttonType,
            text: buttonText,
            ...(buttonType === 'URL' && { url: buttonUrl }),
            ...(buttonType === 'PHONE_NUMBER' && { phone_number: buttonUrl }),
        };
        setButtons([...buttons, newButton]);
        setButtonText('');
        setButtonUrl('');
        setError('');
    };

    const handleRemoveButton = (index) => {
        setButtons(buttons.filter((_, i) => i !== index));
    };

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const bodyExampleData = Object.keys(bodyDynamicFields).length > 0 ? { example: bodyDynamicFields } : undefined;

        const newTemplateData = {
            name: title,
            language: "en_US",
            category: "MARKETING",
            components: [
                {
                    type: "HEADER",
                    format: headerType,
                    ...(headerType === 'TEXT' && { text: headerText }),
                    ...(headerType === 'IMAGE' && { image: headerImage }),
                },
                {
                    type: "BODY",
                    text: body,
                    ...(bodyExampleData && { example: bodyExampleData })
                },
                ...(showFooter ? [{
                    type: "FOOTER",
                    text: footerText
                }] : []),
                ...(showButtons && buttons.length > 0 ? [{
                    type: "BUTTONS",
                    buttons
                }] : [])
            ]
        };

        try {
            const result = await createTemplate(newTemplateData);
            console.log("Template created:", result);
        } catch (err) {
            setError('Failed to create template. Please try again.');
            console.error("Error creating template:", err);
        } finally {
            setLoading(false);
        }
    };


    return (
        <Container>
            <h1 className='mb-5 text-center'>Create WhatsApp Template</h1>
            <Form onSubmit={handleCreateTemplate}>
                <Row>
                    <Col md={5} xs={12}>
                        <div className='pt-5'>
                            {/* Template Name */}
                            <Form.Group as={Row} controlId="formTitle">
                                <Form.Label column sm={12}>Template Name</Form.Label>
                                <Col sm={12}>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter template title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </Col>
                            </Form.Group>
                            {/* Header */}
                            <div className='d-flex justify-content-between mt-4'>
                                <h3>Header</h3>
                                <Form.Check
                                    type="switch"
                                    id="custom-switch"
                                    label="Use Image"
                                    onChange={(e) => setHeaderType(e.target.checked ? 'IMAGE' : 'TEXT')}
                                />
                            </div>
                            {headerType === 'IMAGE' ? (
                                <Form.Group as={Row} controlId="formHeaderImage">
                                    <Form.Label column sm={12}>Image</Form.Label>
                                    <Col sm={12}>
                                        <Form.Control
                                            type="file"
                                            onChange={(e) => setHeaderImage(e.target.files[0])}
                                            required
                                        />
                                    </Col>
                                </Form.Group>
                            ) : (
                                <Form.Group as={Row} controlId="formHeaderText">
                                    <Form.Label column sm={12}>Header Text</Form.Label>
                                    <Col sm={12}>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            type="text"
                                            placeholder="Enter header text"
                                            value={headerText}
                                            onChange={(e) => setHeaderText(e.target.value)}
                                            required
                                        />
                                    </Col>
                                </Form.Group>
                            )}
                            {/* Dynamic Fields for Header */}
                            {headerDynamicField !== null && (
                                <Form.Group as={Row} controlId="formHeaderDynamicField">
                                    <Form.Label column sm={12}>Example for Header Dynamic Field</Form.Label>
                                    <Col sm={12}>
                                        <Form.Control
                                            type="text"
                                            placeholder="Enter example for header dynamic field"
                                            value={headerDynamicField}
                                            onChange={(e) => handleHeaderDynamicFieldChange(e.target.value)}
                                        />
                                    </Col>
                                </Form.Group>
                            )}
                            {/* Body */}
                            <div className=' mt-4'>
                                <h3>Body</h3>
                            </div>
                            <Form.Group as={Row} controlId="formBody">
                                <Form.Label column sm={12}>Description</Form.Label>
                                <Col sm={12}>
                                    <Form.Control
                                        as="textarea"
                                        rows={5}
                                        type="text"
                                        placeholder="Enter description"
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        required
                                    />
                                </Col>
                            </Form.Group>
                            {/* Dynamic Fields for Body */}
                            {Object.keys(bodyDynamicFields).length > 0 && (
                                <div>
                                    <h4>Dynamic Fields in Body</h4>
                                    {Object.keys(bodyDynamicFields).map((key) => (
                                        <Form.Group as={Row} key={key} controlId={`formDynamicField${key}`}>
                                            <Form.Label column sm={12}>Example for {key}</Form.Label>
                                            <Col sm={12}>
                                                <Form.Control
                                                    type="text"
                                                    placeholder={`Enter example for {{${key}}}`}
                                                    value={bodyDynamicFields[key]}
                                                    onChange={(e) => handleBodyDynamicFieldChange(key, e.target.value)}
                                                />
                                            </Col>
                                        </Form.Group>
                                    ))}
                                </div>
                            )}

                            {/* Footer */}
                            <div className='d-flex justify-content-between mt-4'>
                                <h3>Footer</h3>
                                <Form.Check
                                    type="switch"
                                    id="footer-switch"
                                    label="Show Footer"
                                    checked={showFooter}
                                    onChange={(e) => setShowFooter(e.target.checked)}
                                />
                            </div>
                            {showFooter ? (
                                <Form.Group as={Row} controlId="formFooterText">
                                    <Form.Label column sm={12}>Footer Text</Form.Label>
                                    <Col sm={12}>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            type="text"
                                            placeholder="Enter footer text"
                                            value={footerText}
                                            onChange={(e) => setFooterText(e.target.value)}
                                            required
                                        />
                                    </Col>
                                </Form.Group>
                            ) : (
                                <p>Add optional footer text</p>
                            )}
                            {/* Buttons */}
                            <div className='mt-4'>
                                <div className='d-flex justify-content-between'>
                                    <h3>Buttons</h3>
                                    <Form.Check
                                        type="switch"
                                        id="buttons-switch"
                                        label="Show Buttons"
                                        checked={showButtons}
                                        onChange={(e) => setShowButtons(e.target.checked)}
                                    />
                                </div>
                                {showButtons ? (
                                    <>
                                        <Form.Group as={Row} controlId="formButtonType">
                                            <Form.Label column sm={12}>Button Type</Form.Label>
                                            <Col sm={12}>
                                                <Form.Control
                                                    as="select"
                                                    value={buttonType}
                                                    onChange={(e) => setButtonType(e.target.value)}
                                                >
                                                    <option value="URL">URL</option>
                                                    <option value="PHONE_NUMBER">Phone Number</option>
                                                    <option value="QUICK_REPLY">Quick Reply</option>
                                                </Form.Control>
                                            </Col>
                                        </Form.Group>
                                        <Form.Group as={Row} controlId="formButtonText">
                                            <Form.Label column sm={12}>Button Text</Form.Label>
                                            <Col sm={12}>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Enter button text"
                                                    value={buttonText}
                                                    onChange={(e) => setButtonText(e.target.value)}
                                                    required
                                                />
                                            </Col>
                                        </Form.Group>
                                        {(buttonType === 'URL' || buttonType === 'PHONE_NUMBER') && (
                                            <Form.Group as={Row} controlId="formButtonUrl">
                                                <Form.Label column sm={12}>Button {buttonType === 'URL' ? 'URL' : 'Phone Number'}</Form.Label>
                                                <Col sm={12}>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder={`Enter button ${buttonType === 'URL' ? 'URL' : 'phone number'}`}
                                                        value={buttonUrl}
                                                        onChange={(e) => setButtonUrl(e.target.value)}
                                                    />
                                                </Col>
                                            </Form.Group>
                                        )}
                                        <Button variant="secondary" onClick={handleAddButton} className="mt-3">Add Button</Button>
                                        <ul className="list-unstyled mt-3">
                                            {buttons.map((button, index) => (
                                                <li key={index} className="d-flex justify-content-between align-items-center">
                                                    <span>{button.type} - {button.text}</span>
                                                    <Button variant="danger" size="sm" onClick={() => handleRemoveButton(index)}>Remove</Button>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                ) : (
                                    <p>Add optional Button</p>
                                )}
                            </div>
                        </div>
                    </Col>
                    {/* Preview */}
                    <Col className='bg-light' md={7} xs={12}>
                        <div className='bg-light d-flex justify-content-center pt-5'>
                            <Card style={{ width: '18rem' }}>
                                {headerType === 'IMAGE' && headerImage ? (
                                    <Card.Img variant="top" src={URL.createObjectURL(headerImage)} />
                                ) : (
                                    <Card.Title className="p-2">{headerText || "HEADER TEXT"}</Card.Title>
                                )}
                                <Card.Body>
                                    <Card.Text>
                                        {body || "hello world"}
                                    </Card.Text>
                                    {showFooter && <Card.Text>{footerText}</Card.Text>}
                                    {showButtons && buttons.map((button, index) => (
                                        <Button key={index} variant="primary" className="d-block mt-2">{button.text}</Button>
                                    ))}
                                </Card.Body>
                            </Card>
                        </div>
                    </Col>
                </Row>
                <Button className='mt-4' type='submit' disabled={loading}>
                    {loading ? 'Creating...' : 'Add New Template'}
                </Button>
                {error && <p className="text-danger">{error}</p>}
            </Form>
        </Container>
    );
}
