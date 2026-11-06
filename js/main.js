geotab.addin.helloWorld = function () {

    let api;
    let state;
    let initialized = false;

    const status = () => document.getElementById("status");
    const button = () => document.getElementById("testButton");
    const vehicleList = () => document.getElementById("vehicleList");
    const vehicleCount = () => document.getElementById("vehicleCount");
    const error = () => document.getElementById("error");

    var messageStatus = document.getElementById("messageStatus");

    // Send message to Geotab device
    var sendMsg = function (deviceId, packet) {

        // Convert byte array to Base64
        var binary = String.fromCharCode.apply(null, packet);
        var msg = btoa(binary);

        messageStatus.textContent = "Enviando mensaje...";

        api.call(
            "Add",
            {
                typeName: "TextMessage",
                entity: {
                    user: {
                        id: "b2D3"
                    },
                    device: {
                        id: deviceId
                    },
                    messageContent: {
                        mimeType: "text",
                        channelNumber: 1,
                        data: msg,
                        contentType: "MimeContent"
                    },
                    isDirectionToVehicle: true
                }
            },
            function (result) {

                messageStatus.textContent =
                    "Mensaje enviado correctamente.";

                console.log("TextMessage creado:", result);

            },
            function (error) {

                messageStatus.textContent =
                    "Error: " + error.message;

                console.error("Error enviando mensaje:", error);

            }
        );
    };

    function getVehicles() {

        if (!api) {
            error().textContent = "API no inicializada.";
            return;
        }

        button().disabled = true;
        status().textContent = "Consultando MyGeotab...";
        vehicleList().innerHTML = "";
        vehicleCount().textContent = "Consultando...";
        error().textContent = "";

        api.call(
            "Get",
            {
                typeName: "Device",
                resultsLimit: 10
            },
            function (result) {

                status().textContent = "Consulta completada.";

                vehicleCount().textContent =
                    result.length + " dispositivos encontrados.";

                result.forEach(function (device) {

                    const li = document.createElement("li");

                    li.textContent =
                        device.name + " | " + device.id;

                    vehicleList().appendChild(li);

                });

                button().disabled = false;

            },
            function (err) {

                status().textContent = "Error en la consulta.";

                error().textContent =
                    err.message || JSON.stringify(err);

                button().disabled = false;

            }
        );
    }

    return {

        initialize: function (apiObject, stateObject, callback) {

            api = apiObject;
            state = stateObject;

            status().textContent = "Add-In inicializado.";

            document.getElementById("vehiclesButton")
                .addEventListener("click", getVehicles);

            document.getElementById("sendMessageButton")
                .addEventListener("click", function () {

                    sendMsg("b315", [5]);

                }, false);

            initialized = true;

            callback();
        },

        focus: function (apiObject, stateObject) {

            api = apiObject;
            state = stateObject;

            if (initialized) {
                status().textContent = "Conectado a MyGeotab.";
            }

        },

        blur: function () {

            console.log("Hello Geotab: Blur");

        }

    };

};