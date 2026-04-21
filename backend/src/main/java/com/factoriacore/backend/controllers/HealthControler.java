package com.factoriacore.backend.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthControler
{
    @GetMapping("/health")
    public String health()
    {
        return "OK";
    }
}