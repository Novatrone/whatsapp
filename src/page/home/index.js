import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  FormControl,
  Image,
  InputGroup,
  ListGroup,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckDouble,
  faCheck,
  faMessage,
  faPaperclip,
  faPaperPlane,
  faSmile,
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { getTemplates, sendMessage } from "../../service/whatsappApi"; // Ensure this function returns a promise
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
const SOCKET_SERVER_URL = "https://modelpro.craftandcode.in/";

const userData = [
  { id: 2, name: "Akash Mishra", phone: "+919977927692" },
  { id: 3, name: "Abhilash", phone: "+917224901787" },
  { id: 3, name: "Alex", phone: "+346050631219" },
];

function Home() {
  const [chatHistory, setChatHistory] = useState([]);
  const [uploadState, setUploadState] = useState({ status: false, name: "" });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [message, setMessage] = useState("");
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [template, setTemplate] = useState("");
  const [templatesData, setTemplatesData] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState({});
  const [mobileView, setMobileView] = useState(false); // New state for mobile view
  const [selectedUser, setSelectedUser] = useState();

  const [headerParams, setHeaderParams] = useState([]);
  const [params, setParams] = useState([]);
  // const [footerParams, setFooterParams] = useState([]);

  const [socket, setSocket] = useState(null);
  const [show, setShow] = useState(false);
  const [modalStep, setModalStep] = useState(true);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  // const token = localStorage.getItem('token');
  // console.log("token: ", token);

  // useEffect(() => {
  //   localStorage.setItem('token', 'EAAQ2pVDAA4oBOzNBqhn8v2SU9z8ldbG03XsNRvu1oZC6CVZBIcD79xqz2CbdM2zv6NsKIJau3p1mm3RyqlaXipnIXVjZCHVGsZADL19TXaAKO4I4CBiX5GykXBckV1HWDtANOpkZAJbIYRvSmvGmIIYjMMxVNXooZARFv0CfosZCcZAJI6rl4vJmXZAP8MDqD7bFIOETLrxZCGb19uSRC1Iw8ZD')
  // }, [])

  const navigate = useNavigate();

  const scrollRef = useRef(null);

  const SendTemplate = (val) => {
    let component = val.components;

    // Initialize empty parameters
    let headerParams = [];
    let bodyParams = [];
    // let footerParams = [];

    // Function to extract parameters from text
    const extractParameters = (text) => {
      const regex = /{{(\d+)}}/g;
      let match;
      let parameters = [];

      while ((match = regex.exec(text)) !== null) {
        parameters.push(match[1]);
      }

      return parameters;
    };

    // Iterate over the components to set headerParams, bodyParams, and footerParams
    component.forEach((item) => {
      switch (item.type) {
        case "HEADER":
          headerParams = extractParameters(item.text);
          break;
        case "BODY":
          bodyParams = extractParameters(item.text);
          break;
        // case "FOOTER":
        //   footerParams = [item.text];
        //   break;
        default:
          // Handle other types or do nothing
          break;
      }
    });

    // Set the state and other values
    setTemplate(val.name);
    setSelectedTemplate(val);
    setModalStep(false);
    setHeaderParams(headerParams);
    setParams(bodyParams);
    // setFooterParams(footerParams);
  };

  const handleHeaderParamChange = (index, value) => {
    const newParams = [...headerParams];
    newParams[index] = value;
    setHeaderParams(newParams);
  };

  const handleBodyParamChange = (index, value) => {
    const newParams = [...params];
    newParams[index] = value;
    setParams(newParams);
  };

  // const handleFooterParamChange = (index, value) => {
  //   const newParams = [...params];
  //   newParams[index] = value;
  //   setFooterParams(newParams);
  // }

  useEffect(() => {
    // Define an async function inside useEffect
    const fetchData = async () => {
      try {
        if (show) {
          // const token = await getToken();
          const data = await getTemplates();

          if (data && data.data) {
            setTemplatesData(data.data); // Adjust based on API response structure
          }
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
      }
    };

    // Call the async function
    fetchData();
  }, [show]);

  const handleSendMessage = () => {
    if (!selectedUser) {
      alert("Please select a user first");
      return;
    }

    const to = selectedUser.phone;
    const type = template ? "template" : "text";
    const content = template || message;
    const timestamp = Math.floor(Date.now() / 1000);

    const newMessage = {
      userType: "admin",
      text: content,
      type: type,
      timestamp: timestamp,
      status: "sent", // Initial status
      id: null, // Placeholder for the message ID
    };

    const updatedChatHistory = [...chatHistory, newMessage];
    setChatHistory(updatedChatHistory);

    // Save chat history to local storage
    localStorage.setItem(
      `chatHistory_${selectedUser.id}`,
      JSON.stringify(updatedChatHistory)
    );

    sendMessage(to, content, params, type, headerParams)
      .then((id) => {
        // Update status to 'delivered' and set the message ID
        newMessage.status = "delivered";
        newMessage.id = id;

        // Update chat history with the modified newMessage
        const updatedChatHistory = [...chatHistory, newMessage];
        setChatHistory(updatedChatHistory);

        // Save updated chat history to local storage
        localStorage.setItem(
          `chatHistory_${selectedUser.id}`,
          JSON.stringify(updatedChatHistory)
        );

        // Clear fields after sending the message
        setMessage("");
        setTemplate("");
        setParams([]);
      })
      .catch((error) => {
        // Update status to 'failed'
        newMessage.status = "failed";

        // Update chat history with the modified newMessage
        const updatedChatHistory = [...chatHistory, newMessage];
        setChatHistory(updatedChatHistory);

        // Save updated chat history to local storage
        localStorage.setItem(
          `chatHistory_${selectedUser.id}`,
          JSON.stringify(updatedChatHistory)
        );
      });
  };

  useEffect(() => {
    if (selectedUser) {
      const savedChatHistory = localStorage.getItem(
        `chatHistory_${selectedUser.id}`
      );
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
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    };

    return (
      <div style={fullScreenStyles} onClick={() => setIsFullScreen(false)}>
        <img
          src={fullScreenImage}
          alt="Full Screen"
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        />
      </div>
    );
  };

  const handleMessageDesign = (item) => {
    const extractFileName = (url) => {
      const regex = /\/o\/(.+?)\?/;
      const match = url.match(regex);
      const encodedPath = match ? match[1] : "";
      const decodedPath = decodeURIComponent(encodedPath);
      const pathSegments = decodedPath.split("/");
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
      return <>{item.text}</>;
    } else if (item.type === "video") {
      return (
        <>
          <video src={item.url}>video</video>
        </>
      );
    } else if (item.type === "image") {
      return (
        <>
          <img src={item.url} alt="Image" />
        </>
      );
    } else if (item.type === "question") {
      return (
        <>
          {item.questionText}
          {item.options && item.options.length > 0 && (
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
          )}
        </>
      );
    } else if (item.type === "attachment") {
      return (
        <>
          <Row>
            <Col xs={12}>
              {item.mimeType === "image/png" ||
              item.mimeType === "image/jpeg" ? (
                <>
                  {uploadState.status &&
                  uploadState.name === extractFileName(item.url) ? (
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
                  {uploadState.status &&
                  uploadState.name === extractFileName(item.url) ? (
                    <Spinner animation="border" variant="primary" />
                  ) : (
                    <Button
                      href={item.url}
                      download={extractFileName(item.url)}
                      variant="link"
                    >
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
    return new Date(date * 1000).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  useEffect(() => {
    const socketConnection = io(SOCKET_SERVER_URL);
    setSocket(socketConnection);

    socketConnection.on("connect", () => {
      console.log("Connected to the server");
    });

    socketConnection.on("message", (data) => {
      console.log("Received message:", data);

      setChatHistory((prevMessages) => {
        const updatedMessages = [...prevMessages, data];

        // Save updated chat history to local storage
        localStorage.setItem(
          `chatHistory_${selectedUser.id}`,
          JSON.stringify(updatedMessages)
        );

        return updatedMessages;
      });
    });

    socketConnection.on("status_update", (statusData) => {
      console.log("Received status update:", statusData);

      setChatHistory((prevMessages) => {
        const updatedMessages = prevMessages.map((message) =>
          message.id === statusData.id
            ? { ...message, status: statusData.status }
            : message
        );

        // Save updated chat history to local storage
        localStorage.setItem(
          `chatHistory_${selectedUser.id}`,
          JSON.stringify(updatedMessages)
        );

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
          if (message.status !== "read") {
            socket.emit("status_update", {
              id: message.id,
              status: "read",
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
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <div className="bg-light overflow-hidden vh-100">
        <Row className="h-100 g-0">
          {(!mobileView || !selectedUser) && (
            <Col xs={12} md={3}>
              <div className="bg-white d-flex flex-column p-3 h-100">
                <InputGroup className="mb-3">
                  <FormControl placeholder="Search" />
                </InputGroup>
                <Form.Select aria-label="Default select example">
                  <option>Open this select menu</option>
                  <option value="1">One</option>
                  <option value="2">Two</option>
                  <option value="3">Three</option>
                </Form.Select>
                <hr />
                {userData.map((data, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedUser(data)}
                    style={{
                      cursor: "pointer",
                      background:
                        selectedUser?.id === data.id ? "#f1f1f1" : "#fafafa",
                      borderLeft:
                        selectedUser?.id === data.id
                          ? "5px solid #008857"
                          : "5px solid transparent",
                    }}
                    className="d-flex p-2 rounded align-items-center mb-3"
                  >
                    <div className="me-2">
                      <Image
                        src="https://via.placeholder.com/50"
                        roundedCircle
                      />
                    </div>
                    <div>
                      <div>{data.name}</div>
                      <small className="text-muted">{data.phone}</small>
                    </div>
                  </div>
                ))}
              </div>
            </Col>
          )}
          {selectedUser && (
            <Col xs={12} md={9}>
              <div className="d-flex flex-column position-relative h-100">
                <div className="bg-success text-white p-3 d-flex align-items-center justify-content-between">
                  {mobileView && (
                    <Button onClick={() => setSelectedUser(null)}>Back</Button>
                  )}
                  <div>
                    <strong>{selectedUser?.name}</strong>
                  </div>
                </div>
                <div
                  className="flex-grow-1 overflow-auto px-1"
                  ref={scrollRef}
                  style={{ maxHeight: "calc(100vh - 120px)" }}
                >
                  <ListGroup>
                    {chatHistory.length === 0 && (
                      <h6 className="py-5 text-center">No messages yet.</h6>
                    )}
                    {chatHistory.map((item, index) => {
                      const prevItem = chatHistory[index - 1];
                      const isNewDay =
                        !prevItem ||
                        formatDate(item.timestamp) !==
                          formatDate(prevItem.timestamp);
                      return (
                        <React.Fragment key={index}>
                          {isNewDay && (
                            <div className="w-100 text-center my-2">
                              <small className="text-muted">
                                {formatDate(item.timestamp)}
                              </small>
                            </div>
                          )}
                          <div
                            className={`d-flex align-items-end ${
                              item.userType === "admin"
                                ? "flex-row-reverse"
                                : ""
                            } mb-2`}
                          >
                            <div
                              className={`pt-2 px-2 pb-1 text-start shadow-sm`}
                              style={{
                                maxWidth: "70%",
                                wordBreak: "break-word",
                                borderRadius:
                                  item.userType === "admin"
                                    ? "10px 2px 10px 2px"
                                    : "2px 10px 2px 10px",
                                backgroundColor:
                                  item.userType === "admin"
                                    ? "#68d2669c"
                                    : "#fff",
                              }}
                            >
                              <div className="px-3">
                                {handleMessageDesign(item)}
                              </div>
                              <div
                                style={{ fontSize: "12px" }}
                                className="text-end"
                              >
                                <small className="text-muted">
                                  {formatTime(item.timestamp)}
                                </small>
                                {item.userType === "admin" && (
                                  <>
                                    {item.status === "sent" && (
                                      <FontAwesomeIcon
                                        className="ms-2"
                                        icon={faCheck}
                                      />
                                    )}

                                    {item.status === "delivered" && (
                                      <FontAwesomeIcon
                                        className="ms-2"
                                        icon={faCheckDouble}
                                      />
                                    )}

                                    {item.status === "failed" && (
                                      <FontAwesomeIcon
                                        className="ms-2 text-danger"
                                        icon={faCircleExclamation}
                                      />
                                    )}

                                    {item.status === "read" && (
                                      <FontAwesomeIcon
                                        className="ms-2 text-primary"
                                        icon={faCheckDouble}
                                      />
                                    )}
                                  </>
                                )}
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
                      <Button
                        variant="outline-secondary"
                        onClick={handleSendMessage}
                      >
                        <FontAwesomeIcon icon={faPaperPlane} />
                      </Button>
                    </InputGroup>
                  </div>
                )}
              </div>
            </Col>
          )}
          {!mobileView && !selectedUser && (
            <Col
              className="d-flex justify-content-center align-items-center"
              xs={12}
              md={9}
            >
              <h6>Select a user to start chatting</h6>
            </Col>
          )}
        </Row>
      </div>
      <FullScreenView />

      <Modal size="lg" centered show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Select Template</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalStep ? (
            <Container>
              <Row>
                {templatesData.map((template, index) => (
                  <Col key={template.id} xs={12} md={4}>
                    <Card
                      className="mb-3 template-card"
                      style={{ cursor: "pointer" }}
                      onClick={() => SendTemplate(template)}
                    >
                      <Card.Body>
                        <Card.Title className="text-primary">
                          {template.name}
                        </Card.Title>
                        <Card.Text>
                          {template.components.map((component, compIndex) => (
                            <div key={compIndex}>
                              {component.type === "HEADER" && (
                                <strong> {component.text}</strong>
                              )}
                              {component.type === "BODY" && (
                                <p className="mt-2"> {component.text}</p>
                              )}
                              {component.type === "FOOTER" && (
                                <p
                                  style={{
                                    fontSize: "12px",
                                    color: "GrayText",
                                  }}
                                  className="mt-2"
                                >
                                  {" "}
                                  {component.text}
                                </p>
                              )}
                              {component.buttons && (
                                <div className="mt-2">
                                  {component.buttons.map((button, btnIndex) => (
                                    <Button
                                      key={btnIndex}
                                      size="sm"
                                      className=" w-100"
                                    >
                                      {button.text}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
              <Button
                className="p-2"
                variant="primary"
                onClick={() => navigate("/template")}
              >
                <h6>Add New Template</h6>
              </Button>
            </Container>
          ) : (
            <Container>
              <Row>
                <Col xs={12} md={8}>
                  <h6>Header Params value</h6>
                  {headerParams.map((headerParam, index) => (
                    <InputGroup className="mb-3" key={index}>
                      <InputGroup.Text>Parameter {index + 1}</InputGroup.Text>
                      <FormControl
                        value={headerParam}
                        onChange={(e) =>
                          handleHeaderParamChange(index, e.target.value)
                        }
                      />
                    </InputGroup>
                  ))}
                  <h6>Body Params value</h6>
                  {params.map((param, index) => (
                    <InputGroup className="mb-3" key={index}>
                      <InputGroup.Text>Parameter {index + 1}</InputGroup.Text>
                      <FormControl
                        value={param}
                        onChange={(e) =>
                          handleBodyParamChange(index, e.target.value)
                        }
                      />
                    </InputGroup>
                  ))}
                  {/* <h6>Footer Params value</h6>
                  {footerParams.map((param, index) => (
                    <InputGroup className="mb-3" key={index}>
                      <InputGroup.Text>Parameter {index + 1}</InputGroup.Text>
                      <FormControl
                        value={param}
                        onChange={(e) => handleFooterParamChange(index, e.target.value)}
                      />
                    </InputGroup>
                  ))} */}
                </Col>
                <Col xs={12} md={4}>
                  <Card
                    className="mb-3 template-card"
                    style={{ cursor: "pointer" }}
                  >
                    <Card.Body>
                      <Card.Title className="text-primary">
                        {selectedTemplate.name}
                      </Card.Title>
                      <Card.Text>
                        {selectedTemplate.components.map(
                          (component, compIndex) => (
                            <div key={compIndex}>
                              {component.type === "HEADER" && (
                                <strong> {component.text}</strong>
                              )}
                              {component.type === "BODY" && (
                                <p className="mt-2"> {component.text}</p>
                              )}
                              {component.type === "FOOTER" && (
                                <p
                                  style={{
                                    fontSize: "12px",
                                    color: "GrayText",
                                  }}
                                  className="mt-2"
                                >
                                  {" "}
                                  {component.text}
                                </p>
                              )}
                              {component.buttons && (
                                <div className="mt-2">
                                  {component.buttons.map((button, btnIndex) => (
                                    <Button
                                      key={btnIndex}
                                      size="sm"
                                      className=" w-100"
                                    >
                                      {button.text}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Container>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => {
              setModalStep(true);
              setSelectedTemplate({});
              setTemplate("");
            }}
          >
            Back
          </Button>
          <Button variant="primary" onClick={() => setShow(false)}>
            Select
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Home;
