import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Col, Container, Form, FormControl, Image, InputGroup, ListGroup, Modal, Row, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble, faCheck, faMessage, faPaperclip, faPaperPlane, faSmile, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { getTemplates, sendMessage } from '../../service/whatsappApi'; // Ensure this function returns a promise
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
const SOCKET_SERVER_URL = 'http://localhost:5000';

const userData = [
  { id: 1, name: 'Monika', phone: "+918839527514" },
  { id: 2, name: 'Akash', phone: "+919977927692" },
  { id: 3, name: 'Abhishek', phone: "+917000586789" }
];

function Home() {
  const [chatHistory, setChatHistory] = useState([]);
  const [uploadState, setUploadState] = useState({ status: false, name: "" });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [message, setMessage] = useState("");
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [template, setTemplate] = useState('');
  const [templatesData, setTemplatesData] = useState([]);
  const [mobileView, setMobileView] = useState(false); // New state for mobile view
  const [selectedUser, setSelectedUser] = useState();
  const [params, setParams] = useState([]);
  const [socket, setSocket] = useState(null);
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const navigate = useNavigate();

  const scrollRef = useRef(null);

  const SendTemplate = (val, paramsCount) => {
    setTemplate(val);
    setParams(Array(paramsCount).fill(''));
  };

  const handleParamChange = (index, value) => {
    const newParams = [...params];
    newParams[index] = value;
    setParams(newParams);
  };


  useEffect(() => {
    if (show) {
      getTemplates().then((data) => {
        console.log("data: ", data);
        if (data && data.data) {
          setTemplatesData(data.data); // Adjust based on API response structure
        }
      });
    }
  }, [show]);

  const handleSendMessage = () => {
    if (!selectedUser) {
      alert('Please select a user first');
      return;
    }

    const to = selectedUser.phone;
    const type = template ? 'template' : 'text';
    const content = template || message;
    const timestamp = Math.floor(Date.now() / 1000);

    const newMessage = {
      userType: 'admin',
      text: content,
      type: type,
      timestamp: timestamp,
      status: 'sent',  // Initial status
      id: null // Placeholder for the message ID
    };

    const updatedChatHistory = [...chatHistory, newMessage];
    setChatHistory(updatedChatHistory);

    // Save chat history to local storage
    localStorage.setItem(`chatHistory_${selectedUser.id}`, JSON.stringify(updatedChatHistory));

    sendMessage(to, content, params, type)
      .then((id) => {
        // Update status to 'delivered' and set the message ID
        newMessage.status = 'delivered';
        newMessage.id = id;

        // Update chat history with the modified newMessage
        const updatedChatHistory = [...chatHistory, newMessage];
        setChatHistory(updatedChatHistory);

        // Save updated chat history to local storage
        localStorage.setItem(`chatHistory_${selectedUser.id}`, JSON.stringify(updatedChatHistory));

        // Clear fields after sending the message
        setMessage('');
        setTemplate('');
        setParams([]);
      })
      .catch((error) => {
        // Update status to 'failed'
        newMessage.status = 'failed';

        // Update chat history with the modified newMessage
        const updatedChatHistory = [...chatHistory, newMessage];
        setChatHistory(updatedChatHistory);

        // Save updated chat history to local storage
        localStorage.setItem(`chatHistory_${selectedUser.id}`, JSON.stringify(updatedChatHistory));

        console.error('Failed to send message:', error);
      });
  };


  useEffect(() => {
    if (selectedUser) {
      const savedChatHistory = localStorage.getItem(`chatHistory_${selectedUser.id}`);
      if (savedChatHistory) {
        setChatHistory(JSON.parse(savedChatHistory));
      } else {
        setChatHistory([]);
      }
    }
  }, [selectedUser]);

  const FullScreenView = () => {
    if (!isFullScreen) return null;

    const fullScreenStyles = {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    };

    return (
      <div style={fullScreenStyles} onClick={() => setIsFullScreen(false)}>
        <img src={fullScreenImage} alt="Full Screen" style={{ maxWidth: '100%', maxHeight: '100%' }} />
      </div>
    );
  };

  const handleMessageDesign = (item) => {
    const extractFileName = (url) => {
      const regex = /\/o\/(.+?)\?/;
      const match = url.match(regex);
      const encodedPath = match ? match[1] : '';
      const decodedPath = decodeURIComponent(encodedPath);
      const pathSegments = decodedPath.split('/');
      return pathSegments.pop();
    };

    const getFileIcon = (mimeType) => {
      switch (mimeType) {
        case "application/pdf":
          return "📄"; // Placeholder for PDF icon
        default:
          return "📁"; // Generic file icon for unknown types
      }
    };

    if (item.type === "text") {
      return (
        <>
          {item.text}
        </>
      );
    }
    else if (item.type === "video") {
      return (
        <>
          <video src={item.url}>
            video
          </video>
        </>
      );
    }
    else if (item.type === "image") {
      return (
        <>
          <img src={item.url} alt='Image' />
        </>
      );
    }
    else if (item.type === "question") {
      return (
        <>
          {item.questionText}
          {item.options && item.options.length > 0 &&
            <Row className="mt-2">
              {item.options.map((option, idx) => (
                <Col xs={12} sm={6} key={idx}>
                  <Button
                    variant={option.selected ? "success" : "primary"}
                    block
                    size="sm"
                  >
                    {option.option}
                  </Button>
                </Col>
              ))}
            </Row>
          }
        </>
      );
    }
    else if (item.type === "attachment") {
      return (
        <>
          <Row>
            <Col xs={12}>
              {item.mimeType === "image/png" || item.mimeType === "image/jpeg" ? (
                <>
                  {uploadState.status && uploadState.name === extractFileName(item.url) ? (
                    <Spinner animation="border" variant="primary" />
                  ) : (
                    <Image
                      src={item.url}
                      alt="Image"
                      fluid
                      style={{ maxWidth: "350px" }}
                      onClick={() => {
                        setFullScreenImage(item.url);
                        setIsFullScreen(true);
                      }}
                    />
                  )}
                </>
              ) : (
                <>
                  {uploadState.status && uploadState.name === extractFileName(item.url) ? (
                    <Spinner animation="border" variant="primary" />
                  ) : (
                    <Button href={item.url} download={extractFileName(item.url)} variant="link">
                      <span>{getFileIcon(item.mimeType)}</span>
                      <small>{extractFileName(item.url)}</small>
                    </Button>
                  )}
                </>
              )}
            </Col>
          </Row>
        </>
      );
    }
  };

  // const handleMessageDesign = (item) => {
  //   const extractFileName = (url) => {
  //     const regex = /\/o\/(.+?)\?/;
  //     const match = url.match(regex);
  //     const encodedPath = match ? match[1] : '';
  //     const decodedPath = decodeURIComponent(encodedPath);
  //     const pathSegments = decodedPath.split('/');
  //     return pathSegments.pop();
  //   };

  //   const getFileIcon = (mimeType) => {
  //     switch (mimeType) {
  //       case "application/pdf":
  //         return "📄"; // Placeholder for PDF icon
  //       default:
  //         return "📁"; // Generic file icon for unknown types
  //     }
  //   };

  //   if (item.type === "text") {
  //     return (
  //       <>
  //         {item.text}
  //       </>
  //     );
  //   }
  //   else if (item.type === "question") {
  //     return (
  //       <>
  //         {item.questionText}
  //         {item.options && item.options.length > 0 &&
  //           <Row className="mt-2">
  //             {item.options.map((option, idx) => (
  //               <Col xs={12} sm={6} key={idx}>
  //                 <Button
  //                   variant={option.selected ? "success" : "primary"}
  //                   block
  //                   size="sm"
  //                 >
  //                   {option.option}
  //                 </Button>
  //               </Col>
  //             ))}
  //           </Row>
  //         }
  //       </>
  //     );
  //   } else if (item.type === "attachment") {
  //     return (
  //       <>
  //         <Row>
  //           <Col xs={12}>
  //             {item.mimeType === "image/png" || item.mimeType === "image/jpeg" ? (
  //               <>
  //                 {uploadState.status && uploadState.name === extractFileName(item.url) ? (
  //                   <Spinner animation="border" variant="primary" />
  //                 ) : (
  //                   <Image
  //                     src={item.url}
  //                     alt="Image"
  //                     fluid
  //                     style={{ maxWidth: "350px" }}
  //                     onClick={() => {
  //                       setFullScreenImage(item.url);
  //                       setIsFullScreen(true);
  //                     }}
  //                   />
  //                 )}
  //               </>
  //             ) : (
  //               <>
  //                 {uploadState.status && uploadState.name === extractFileName(item.url) ? (
  //                   <Spinner animation="border" variant="primary" />
  //                 ) : (
  //                   <Button href={item.url} download={extractFileName(item.url)} variant="link">
  //                     <span>{getFileIcon(item.mimeType)}</span>
  //                     <small>{extractFileName(item.url)}</small>
  //                   </Button>
  //                 )}
  //               </>
  //             )}
  //           </Col>
  //         </Row>
  //       </>
  //     );
  //   }
  // };

  const formatTime = (date) => {
    return new Date(date * 1000).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };


  useEffect(() => {
    const socketConnection = io(SOCKET_SERVER_URL);
    setSocket(socketConnection);

    socketConnection.on('connect', () => {
      console.log('Connected to the server');
    });

    socketConnection.on('message', (data) => {
      console.log('Received message:', data);

      setChatHistory((prevMessages) => {
        const updatedMessages = [...prevMessages, data];

        // Save updated chat history to local storage
        localStorage.setItem(`chatHistory_${selectedUser.id}`, JSON.stringify(updatedMessages));

        return updatedMessages;
      });
    });

    socketConnection.on('status_update', (statusData) => {
      console.log('Received status update:', statusData);

      setChatHistory((prevMessages) => {
        const updatedMessages = prevMessages.map((message) =>
          message.id === statusData.id
            ? { ...message, status: statusData.status }
            : message
        );

        // Save updated chat history to local storage
        localStorage.setItem(`chatHistory_${selectedUser.id}`, JSON.stringify(updatedMessages));

        return updatedMessages;
      });
    });

    return () => {
      socketConnection.disconnect();
    };
  }, [selectedUser]);

  useEffect(() => {
    if (socket && chatHistory.length > 0) {
      // Function to mark messages as read
      const markMessagesAsRead = () => {
        chatHistory.forEach((message) => {
          if (message.status !== 'read') {
            socket.emit('status_update', {
              id: message.id,
              status: 'read'
            });
          }
        });
      };

      // Call this function when chatHistory updates
      markMessagesAsRead();
    }
  }, [chatHistory, socket]);


  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);


  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <div className="bg-light overflow-hidden vh-100">
        <Row className="h-100 g-0">
          {(!mobileView || !selectedUser) && (
            <Col xs={12} md={3}>
              <div className="bg-white d-flex flex-column p-3 h-100">
                <InputGroup className='mb-3'>
                  <FormControl
                    placeholder="Search"
                  />
                </InputGroup>
                <Form.Select aria-label="Default select example">
                  <option>Open this select menu</option>
                  <option value="1">One</option>
                  <option value="2">Two</option>
                  <option value="3">Three</option>
                </Form.Select>
                <hr />
                {userData.map((data, index) =>
                  <div
                    key={index}
                    onClick={() => setSelectedUser(data)}
                    style={{
                      cursor: "pointer",
                      background: selectedUser?.id === data.id ? "#f1f1f1" : "#fafafa",
                      borderLeft: selectedUser?.id === data.id ? "5px solid #008857" : "5px solid transparent"
                    }}
                    className="d-flex p-2 rounded align-items-center mb-3"
                  >
                    <div className="me-2">
                      <Image src="https://via.placeholder.com/50" roundedCircle />
                    </div>
                    <div>
                      <div>{data.name}</div>
                      <small className="text-muted">{data.phone}</small>
                    </div>
                  </div>
                )}
              </div>
            </Col>
          )}
          {selectedUser &&
            <Col xs={12} md={9}>
              <div className="d-flex flex-column position-relative h-100">
                <div className="bg-success text-white p-3 d-flex align-items-center justify-content-between">
                  {mobileView &&
                    <Button onClick={() => setSelectedUser(null)}>
                      Back
                    </Button>
                  }
                  <div>
                    <strong>{selectedUser?.name}</strong>
                  </div>
                </div>
                <div className="flex-grow-1 overflow-auto px-1" ref={scrollRef} style={{ maxHeight: 'calc(100vh - 120px)' }}>
                  <ListGroup>
                    {chatHistory.length === 0 && <h6 className='py-5 text-center'>No messages yet.</h6>}
                    {chatHistory.map((item, index) => {
                      const prevItem = chatHistory[index - 1];
                      const isNewDay = !prevItem || formatDate(item.timestamp) !== formatDate(prevItem.timestamp);
                      return (
                        <React.Fragment key={index}>
                          {isNewDay && (
                            <div className="w-100 text-center my-2">
                              <small className="text-muted">
                                {formatDate(item.timestamp)}
                              </small>
                            </div>
                          )}
                          <div className={`d-flex align-items-end ${item.userType === "admin" ? 'flex-row-reverse' : ''} mb-2`}>
                            <div
                              className={`pt-2 px-2 pb-1 text-start shadow-sm`} style={{ maxWidth: '70%', wordBreak: 'break-word', borderRadius: item.userType === "admin" ? '10px 2px 10px 2px' : '2px 10px 2px 10px', backgroundColor: item.userType === "admin" ? '#68d2669c' : '#fff' }}>
                              <div className='px-3'>
                                {handleMessageDesign(item)}
                              </div>
                              <div style={{ fontSize: "12px" }} className="text-end">
                                <small className="text-muted">{formatTime(item.timestamp)}</small>
                                {item.userType === "admin" &&
                                  <>
                                    {
                                      item.status === "sent" &&
                                      <FontAwesomeIcon className='ms-2' icon={faCheck} />
                                    }

                                    {item.status === "delivered" &&
                                      <FontAwesomeIcon className='ms-2' icon={faCheckDouble} />
                                    }

                                    {item.status === "failed" &&
                                      <FontAwesomeIcon className='ms-2 text-danger' icon={faCircleExclamation} />
                                    }

                                    {item.status === "read" &&
                                      <FontAwesomeIcon className='ms-2 text-primary' icon={faCheckDouble} />
                                    }
                                  </>
                                }
                              </div>
                            </div>

                          </div>
                        </React.Fragment>
                      );
                    })}
                  </ListGroup>
                </div>
                {selectedUser && (
                  <div className="bg-light p-3 d-flex align-items-center">
                    <Button variant="outline-success" onClick={handleShow}>
                      Template
                    </Button>
                    <InputGroup className="ms-2 me-2">
                      <FormControl
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={!!template}
                      />
                      <Button variant="outline-secondary">
                        <FontAwesomeIcon icon={faPaperclip} />
                      </Button>
                      <Button variant="outline-secondary">
                        <FontAwesomeIcon icon={faSmile} />
                      </Button>
                      <Button variant="outline-secondary" onClick={handleSendMessage}>
                        <FontAwesomeIcon icon={faPaperPlane} />
                      </Button>
                    </InputGroup>
                  </div>
                )}
              </div>
            </Col>
          }
          {(!mobileView && !selectedUser) &&
            <Col className='d-flex justify-content-center align-items-center' xs={12} md={9}>
              <h6>Select a user to start chatting</h6>
            </Col>
          }
        </Row>
      </div >
      <FullScreenView />

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Select Template</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className='d-flex gap-2 mb-4'>
            {templatesData.map((template, index) =>
              <Card className='p-2' variant="primary" onClick={() => SendTemplate(template.name, 0)}>
                <h6>{template.name}</h6>
              </Card>
            )}
            <Button className='p-2' variant="primary" onClick={() => navigate('/template')}>
              <h6>Add New Template</h6>
            </Button>
          </div>

          {params.map((param, index) => (
            <InputGroup className="mb-3" key={index}>
              <InputGroup.Text>Parameter {index + 1}</InputGroup.Text>
              <FormControl
                value={param}
                onChange={(e) => handleParamChange(index, e.target.value)}
              />
            </InputGroup>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShow(false)}>Select</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Home;