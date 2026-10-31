import './Nav.css'
import { Header } from '@avtac/ui'
import { Region, Subregion } from '@avtac/ui/Layout'

function Nav() {
  return (
    <>
      <Header title='AVTAC' />
      <div id='body'>
        <Region id='left'>
          <Subregion id='links'>
            <a href={'/balance'}><button>Balance</button></a>
            <p><b>Balance</b> is a tool for performing aircraft weight and balance calculations. The main page is for day to day use where you can load a profile and run some calculations. The config page is where you can build and adjust the configuration. This provides a way to create multiple configurations, define seat/cargo areas, and aircraft limits. For more info check out the <a href='https://github.com/avtac/avtac/tree/main/docs'>docs</a> on GitHub</p>
            <a href={'/lcio'}><button>LCIO Vis</button></a>
            <p><b>LCIO Vis</b> or Low Close-in Obstacle visualizer creates a visual representation of the low, close-in obstacles published in the trouble-Ts section of the FAA flight publications. Simply copy the text from the document that contains your desired airport and pasted it in the box in the top left. Use the dropdown to select your airport and choose the runway.</p>
          </Subregion>
          <Subregion>
            <h2>Contributing</h2>
            <p>Everything here is open-source and open for anyone to contribute. If you have an idea for a new app to add or find an issue with one of the available apps head over to the <a href='https://github.com/avtac/avtac'>GitHub Page</a> where you can create a new issue.</p>
          </Subregion>

        </Region>
        <Region id='right'>
          <Subregion>
            <h2>Welcome</h2>
            <p>
              Welcome to AVTAC! This is a place where I create and publish tools and calculators I believe could be useful for pilots.
            </p>
            <br />
            <p>
              On the left you will find links to each of the available tools. There are currently only 2 available but more will most likely be added in the future.
            </p>
          </Subregion>
          <Subregion>
            <h2>About Me</h2>
            <p>
              I've been a pilot for over 10 years and have also had an interest in programming and computing for much of my life. I have always found that a lot of aviation can be quite laborious with repetitive tasks in planning for flights. From the start of my flying career I have created tools to help speed up the process and possibly reduce chances for errors.
            </p>
            <p>
              Creating this website is my way to share these tools with others. It also provides me with a reason to continue learning more be it new programming techniques or how to host a website.
            </p>
          </Subregion>
        </Region>
      </div>
    </>
  )
}

export default Nav
