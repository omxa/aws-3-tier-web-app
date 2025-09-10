
    import React, {Component} from 'react';
    import architecture from '../../assets/3TierArch.png'

    class Home extends Component {
        render () {
        return (
            <div>
            <h1 style={{color:"white"}}>AWS 3-TIER WEB APPLICATION DEMO</h1>
            <img src={architecture} alt="3T Web App Architecture" style={{height:400,width:825}} />

            <footer>
                    <p>By: Omar Mahmood "omxa.github.io"</p>
            </footer>
          </div>
        );
      }
    }

    export default Home;