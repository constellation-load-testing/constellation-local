import logo from './logo.svg';
import './App.css';
import {useState, useEffect} from 'react';
import axios from 'axios';
import NavBar from './components/NavBar';
import GraphCarousel from './components/GraphCarousel';
import LoadingBubble from './components/LoadingBubble';
import Footer from './components/Footer';

function App() {
	const [data, setData] = useState({regions: []});
  const [shownRegion, setShownRegion] = useState()
  const [aggTime, setAggTime] = useState("1");

  useEffect(() => {
    if (!shownRegion && data.regions.length > 0) {
      setShownRegion(data.regions[0])
    }
  }, [data])

  useEffect(() => {
    (async () => {
      const result = await axios.get(`http://localhost:3002/data?time=${aggTime}`);
      setData(result.data);
    })();
  }, [aggTime])

  useEffect(() => {
    (async () => {
      const result = await axios.get(`http://localhost:3002/data?time=${aggTime}`);
      setData(result.data);
    })();
    //
    // this exists to support having the visualizer open while a test is running
    // however, it will use the default aggTime of 1
    setInterval(async () => {
      axios.get(`http://localhost:3002/data?time=${aggTime}`)
        .then(res => {
          setData(res.data);
        })
        .catch(err => {
          console.log(err);
        })
    }, 300000);
  }, []);
  return (
    <div className="App">
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css"
        integrity="sha384-Zenh87qX5JnK2Jl0vWa8Ck2rdkQ2Bzep5IDxbcnCeuOxjzrPF/et3URy9Bv1WTRi"
        crossOrigin="anonymous"
        />
      <header>
        <NavBar regions={data.regions} setShownRegion={setShownRegion} setAggTime={setAggTime} />
      </header>
      <div>
        {!shownRegion ? LoadingBubble() : [shownRegion].map((region) => {
          return (
            <GraphCarousel key={region} region={region} data={data} />
          )
        })}
      </div>
      {/* dont know if i should use yet {Footer()} */}
    </div>
  );
}

export default App;
