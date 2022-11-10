import Spinner from 'react-bootstrap/Spinner';

function LoadingBubble() {
  return (
    <div style={{"paddingTop": "15%"}} >
      <Spinner animation="grow" />
      <p>Please wait for your test to finish running and for your data to be delivered</p>
    </div>
  );
}

export default LoadingBubble;
