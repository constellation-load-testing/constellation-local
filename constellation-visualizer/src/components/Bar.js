import {Bar} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);



const BarGraph = (input, region) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: region,
      },
    },
  };
  const urlLabels = Object.keys(input[region].calls);
  const data = {
    labels: urlLabels,
    datasets: [
      {
        label: 'OK',
        data: urlLabels.map((url) =>{
          let ok = 0;
          Object.keys(input[region].calls[url]).forEach((status) => {
            if (status < 400) {
              ok += input[region].calls[url][status];
            }
          });
          return ok;
        }),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Error',
        data: urlLabels.map((url) => {
          let errorRate = 0;
          Object.keys(input[region].calls[url]).forEach((status) => {
            if (status >= 400) {
              errorRate += input[region].calls[url][status];
            }
          })
          return errorRate;
        }),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };
  // const statusData = input[region].calls.map(d => d.status);
  return <Bar options={options} data={data} />;
}

export default BarGraph;
