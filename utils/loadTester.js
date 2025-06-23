import axios from "axios";

const URL = "http://localhost:8080";

const makeRequests = async () => {
//   for (let i = 0; i < 10000; i++) {
    axios.get(URL).then((res) => {
      console.log(res.data);
    }).catch(console.error);
//   }
};

makeRequests();