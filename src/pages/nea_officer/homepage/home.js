document.addEventListener("DOMContentLoaded", () => {

  const ctx = document.getElementById('hygieneTrendChart').getContext('2d');

  const gradeData = [4, 3, 3, 2, 3, 4]; // A B B C B A

  function convertToGrade(value) {
    switch(value) {
      case 4: return 'A';
      case 3: return 'B';
      case 2: return 'C';
      case 1: return 'D';
      default: return '';
    }
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun'],
      datasets: [{
        label: 'Hygiene Grade',
        data: gradeData,
        borderColor: '#009481',
        backgroundColor: 'rgba(0,148,129,0.15)',
        fill: true,
        tension: 0.3,
        pointRadius: 5,
        pointBackgroundColor: '#009481',
        pointBorderColor: '#064e3b'
      }]
    },
    options: {
      responsive: true,
      parsing: false, // Important for raw numbers

      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `Grade: ${convertToGrade(ctx.raw)}`
          }
        }
      },

      scales: {
        y: {
          reverse: true, // Optional: puts A on top
          min: 1,
          max: 4,
          ticks: {
            stepSize: 1,
            callback: (value) => convertToGrade(value)
          },
          title: {
            display: true,
            text: 'Hygiene Grade'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Month'
          }
        }
      }
    }
  });

});
