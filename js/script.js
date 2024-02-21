// jshint esversion: 6


const festivals = [
    { name: 'GALA 24', date: '26 May',loc: 'London, UK', itinerary: 'Fly to London - Party times!' },
    { name: 'Sonar 24', date: 'June 13 - 15',loc: 'Barcelona, Spain', itinerary: 'Fly to Barcelona on the 8th - Fly out the 16th' },
    { name: 'Love International', date: 'July 10 - 16',loc: 'Tisno, Croatia', itinerary: 'Dependent on ticket availability' },
    { name: 'BBK 24', date: 'July 11 - 13 ', loc: 'Bilbao, Spain', itinerary: 'Fly to Bilbao on 10th - Fly out the 14th  ' },
    // { name: 'Dekmantel 24', date: 'July 26 - 4 August',loc: 'Amsterdam, NL', itinerary: 'Dependent on tickets' },
    { name: 'Dekmantel Selectors', date: 'August 22 - 26',loc: 'Tisno, Croatia', itinerary: 'Dependent on ticket availability' },
    { name: 'MEO Kalorama', date: 'August 29 - 31',loc: 'Lisboa, Portugal', itinerary: 'Fly from Croatia on the 27th, work remotely, stay for a few days after festival' },
   
];

// Function to populate the festival panel
function populateFestivalPanel() {
    const panel = document.getElementById('festival-panel');

    festivals.forEach((festival, index) => {
        const festivalDiv = document.createElement('div');
        festivalDiv.classList.add('festival-card');
        festivalDiv.id = `box${index+1}`
        // festivalDiv.classList.add('border-gradient');
        festivalDiv.innerHTML = `<div class="festival-number" id="number${index+1}">
                                    ${index + 1}
                                </div>
                                <h3>${festival.name}</h3>
                                <p>Date: ${festival.date}</p>
                                <p>Location: ${festival.loc}</p>
                                <p>Itinerary: ${festival.itinerary}</p>
                                <div class="buttons-right">
                                    <button onclick="selection(${index+1})" class="go-button">GO</button> 
                                    <button onclick="soldout(${index+1})" class="sold-out">x</button> 
                                </div>`;
        panel.appendChild(festivalDiv);
    });
}


function populateConfetti() {
    const container = document.getElementById("container");
    const numConfetti = 50;
    for (let i = 0; i < numConfetti; i++) {
        const confettiDiv = document.createElement("div");
        confettiDiv.classList.add("confetti");
        container.appendChild(confettiDiv);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    populateFestivalPanel();
    populateConfetti();
});


function selection(id){
    document.getElementById(`box${id}`).classList.add("green-border"); 
}

function soldout(id){
    document.getElementById(`box${id}`).classList.add("red-border"); 
    //document.getElementById(`box${id}`).hidden = true;
    document.getElementById(`number${id}`).innerHTML = "SOLD OUT"
}