import Carousel from 'react-bootstrap/Carousel';
import LineGraph from './Line';
import BarGraph from './Bar';

function GraphCarousel({ data, region }) {
  return (
    <Carousel variant="dark" interval={100000000} key={region}>
      <Carousel.Item>
        <div key={`line-${region}`} style={{padding: 50, width: "75%", display: 'inline-block'}} >
          {LineGraph(data, region)}
        </div>
      </Carousel.Item>
      <Carousel.Item>
        <div key={`bar-${region}`} style={{padding: 50, width: "75%", display: 'inline-block'}} >
          {BarGraph(data, region)}
        </div>
      </Carousel.Item>
    </Carousel>
  );
}

export default GraphCarousel;
