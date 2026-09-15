package cr.ac.ucr.paraiso.ie.c5h060.expresofast.controller;

import cr.ac.ucr.paraiso.ie.c5h060.expresofast.business.EnvioService;
import cr.ac.ucr.paraiso.ie.c5h060.expresofast.domain.Envio;
import cr.ac.ucr.paraiso.ie.c5h060.expresofast.dto.ActualizarEstadoRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/envios")
@CrossOrigin(origins = "*")
public class EnvioController {

    private final EnvioService envioService;

    public EnvioController(EnvioService envioService) {
        this.envioService = envioService;
    }

    @GetMapping("/optimizados")
    public ResponseEntity<List<Envio>> obtenerEnviosOptimizados() {
        List<Envio> envios = envioService.obtenerEnviosOptimizados();
        return ResponseEntity.ok(envios);
    }

    /**
     * {
     * "codigoRastreo": "1",
     * "direccionDestino": "Cartago",
     * "pesoKg": 10.0,
     * "costo": 3500.00,
     * "vehiculo": { "id": 1 },
     * "conductor": { "id": 1 }
     * }
     */

    @PostMapping
    public ResponseEntity<Envio> registrarEnvio(@RequestBody Envio envio) {
        Envio envioCreado = envioService.registrarEnvio(envio);
        return ResponseEntity.status(HttpStatus.CREATED).body(envioCreado);
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<Envio> actualizarEstado(@PathVariable("id") Integer id,
            @RequestBody ActualizarEstadoRequest request) {
        Envio envioActualizado = envioService.actualizarEstado(id, request.estado());
        return ResponseEntity.ok(envioActualizado);
    }
}