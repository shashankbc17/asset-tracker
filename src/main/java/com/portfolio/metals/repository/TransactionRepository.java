package com.portfolio.metals.repository;

import com.portfolio.metals.model.MetalTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for MetalTransaction entities.
 */
@Repository
public interface TransactionRepository extends JpaRepository<MetalTransaction, Long> {

    List<MetalTransaction> findByUserIdOrderByDisplayOrderAscIdDesc(String userId);

    List<MetalTransaction> findByUserIdOrderByDateDesc(String userId);

    void deleteByUserId(String userId);
}
