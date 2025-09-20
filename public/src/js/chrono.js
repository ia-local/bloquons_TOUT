// Le script de compte à rebours est le même que dans index.html
const countdownDate = new Date("Sep 10, 2025 00:00:00").getTime();
const x = setInterval(function() {
    const now = new Date().getTime();
    const distance = countdownDate - now;
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    document.getElementById("dashboard-countdown").innerHTML = days + "j " + hours + "h " + minutes + "m " + seconds + "s ";
    if (distance < 0) {
        clearInterval(x);
        document.getElementById("dashboard-countdown").innerHTML = "La manifestation a commencé !";
    }
    }, 1000);