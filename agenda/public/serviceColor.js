// serviceColor.js
const ServiceColor = {
    getServiceColor: function(service) {
        switch(service) {
            case 'Polarizado':
                return '#AAAAAA'; 
            case 'Grabado':
                return '#04D8B2'; 
            case 'Audio':
                return '#00BFFF'; 
            default:
                return '#555555'; 
        }
    }
};