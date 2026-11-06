geotab.addin.helloWorld = function () {

    let api;
    let state;
    let initialized = false;

    const status = () => document.getElementById("status");
    const button = () => document.getElementById("testButton");
    const vehicleList = () => document.getElementById("vehicleList");
    const vehicleCount = () => document.getElementById("vehicleCount");
    const error = () => document.getElementById("error");

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

            button().addEventListener("click", getVehicles);

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