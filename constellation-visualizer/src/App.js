import logo from './logo.svg';
import './App.css';
import LineGraph from './components/Line';
import BarGraph from './components/Bar';
import {useState, useEffect} from 'react';
import axios from 'axios';

function App() {
	const [data, setData] = useState()

	useEffect(() => {
		(async () => {
			const result = await axios.get('http://localhost:3002/data');
			setData(result.data);
			console.log(result.data);
		})();
		setInterval(async () => {
			axios.get('http://localhost:3002/data')
				.then(res => {
					setData(res.data);
				})
				.catch(err => {
					console.log(err);
				})
		}, 10000);
	}, []);
	return (
		<div className="App">
			<div>
				{!data ? null : data.regions.map((region, index) => {
					return (
						<div key={index} style={{padding: 50, width: 1000, display: 'inline-block'}} >
              {console.log(data[region])}
						{LineGraph(data, region)}
            {BarGraph(data, region)}
					</div>
					)
				})}
			</div>
		</div>
	);
}

export default App;
